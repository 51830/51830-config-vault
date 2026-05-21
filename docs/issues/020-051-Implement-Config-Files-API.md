# [051] Implement Config Files API

**Issue #20 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [050] sudah membuat Apps API. Sekarang kita perlu membuat API untuk config files: upload file config, parsing otomatis, dan memilih key-value yang akan disimpan.

## Goal
Buat endpoint untuk upload file config, list config files per app, dan detail config file.

## Steps

### 1. Buat backend/app/schemas/config_file.py
```python
from pydantic import BaseModel
from typing import Optional


class ConfigFileResponse(BaseModel):
    id: int
    app_id: int
    filename: str
    file_type: str
    version: int
    note: Optional[str] = None
    uploaded_at: str

    class Config:
        from_attributes = True


class ConfigFileListResponse(BaseModel):
    total: int
    items: list[ConfigFileResponse]


class UploadResponse(BaseModel):
    config_file: ConfigFileResponse
    total_items: int
    parsed_keys: list[str]


class ParsedItem(BaseModel):
    key: str
    value: str
    is_sensitive: bool
    is_selected: bool
```

### 2. Buat backend/app/routers/configs.py
```python
import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.app_model import App
from app.models.config_file import ConfigFile
from app.models.config_item import ConfigItem
from app.schemas.config_file import (
    ConfigFileResponse,
    ConfigFileListResponse,
    UploadResponse,
)
from app.parsers.registry import registry
from app.services.encryption import EncryptionService
from app.services.versioning import VersioningService
from app.middleware.role_checker import require_role

router = APIRouter(prefix="/api/v1", tags=["configs"])

# Keyword untuk auto-detect sensitive
SENSITIVE_KEYWORDS = {
    "password", "passwd", "secret", "token", "key",
    "api_key", "private", "credential", "auth",
    "access_key", "secret_key",
}


def _is_sensitive(key: str) -> bool:
    """Deteksi apakah suatu key sensitif berdasarkan keyword."""
    key_lower = key.lower()
    for keyword in SENSITIVE_KEYWORDS:
        if keyword in key_lower:
            return True
    return False


@router.get("/apps/{app_id}/configs", response_model=ConfigFileListResponse)
def list_config_files(
    app_id: int,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found",
        )

    query = db.query(ConfigFile).filter(ConfigFile.app_id == app_id)
    total = query.count()
    items = (
        query.order_by(ConfigFile.version.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return ConfigFileListResponse(
        total=total,
        items=[
            ConfigFileResponse(
                id=cf.id,
                app_id=cf.app_id,
                filename=cf.filename,
                file_type=cf.file_type,
                version=cf.version,
                note=cf.note,
                uploaded_at=str(cf.uploaded_at) if cf.uploaded_at else "",
            )
            for cf in items
        ],
    )


@router.get("/configs/{config_id}", response_model=ConfigFileResponse)
def get_config_file(config_id: int, db: Session = Depends(get_db)):
    cf = db.query(ConfigFile).filter(ConfigFile.id == config_id).first()
    if not cf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config file not found",
        )
    return ConfigFileResponse(
        id=cf.id,
        app_id=cf.app_id,
        filename=cf.filename,
        file_type=cf.file_type,
        version=cf.version,
        note=cf.note,
        uploaded_at=str(cf.uploaded_at) if cf.uploaded_at else "",
    )


@router.post(
    "/apps/{app_id}/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_config(
    app_id: int,
    file: UploadFile = File(...),
    note: str = Form(""),
    db: Session = Depends(get_db),
    _=Depends(require_role("editor")),
):
    # Validasi app exists
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found",
        )

    # Baca konten file
    content = await file.read()
    try:
        text_content = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be UTF-8 encoded",
        )

    # Deteksi parser
    parser = registry.get_parser(file.filename or "")
    if parser is None:
        supported = ", ".join(registry.get_supported_extensions())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file.filename}'. Supported: {supported}",
        )

    # Parse content
    try:
        parsed_data = parser.parse(text_content)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Tentukan file type dari parser
    file_type = ""
    if file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        file_type = ext

    # Dapatkan versi berikutnya
    versioning = VersioningService(db)
    next_version = versioning.get_next_version(app_id)

    # Buat config file record
    config_file = ConfigFile(
        app_id=app_id,
        filename=file.filename or "unknown",
        file_type=file_type,
        version=next_version,
        note=note,
    )
    db.add(config_file)
    db.flush()

    # Encrypt dan simpan config items
    enc_service = EncryptionService(db)
    parsed_keys = []
    for key, value in parsed_data.items():
        encrypted_value, key_version = enc_service.encrypt(value)
        config_item = ConfigItem(
            config_file_id=config_file.id,
            key_path=key,
            value_encrypted=encrypted_value,
            is_sensitive=_is_sensitive(key),
            is_selected=True,  # Default selected
            key_version=key_version,
        )
        db.add(config_item)
        parsed_keys.append(key)

    db.commit()
    db.refresh(config_file)

    return UploadResponse(
        config_file=ConfigFileResponse(
            id=config_file.id,
            app_id=config_file.app_id,
            filename=config_file.filename,
            file_type=config_file.file_type,
            version=config_file.version,
            note=config_file.note,
            uploaded_at=str(config_file.uploaded_at) if config_file.uploaded_at else "",
        ),
        total_items=len(parsed_keys),
        parsed_keys=parsed_keys,
    )
```

### 3. Register router di main.py
```python
from app.routers import configs
app.include_router(configs.router)
```

## Verification
- [ ] `GET /api/v1/apps/{app_id}/configs` mengembalikan list config files
- [ ] `POST /api/v1/apps/{app_id}/upload` dengan file .env berhasil upload (201)
- [ ] `POST /api/v1/apps/{app_id}/upload` dengan format tidak dikenal return 400
- [ ] Upload app_id tidak ada return 404
- [ ] Response upload menyertakan parsed_keys dan total_items
- [ ] File non-UTF-8 return 400

## Depends on
#17
