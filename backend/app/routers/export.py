from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.config_file import ConfigFile
from app.models.config_item import ConfigItem
from app.services.exporter import export_config
from app.services.encryption import EncryptionService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/export", tags=["export"])

MEDIA_TYPE_MAP = {
    "env": "text/plain",
    "json": "application/json",
    "yaml": "text/yaml",
    "yml": "text/yaml",
    "toml": "application/toml",
    "ini": "text/plain",
    "cfg": "text/plain",
    "php": "text/x-php",
}


@router.get("/config-files/{config_file_id}")
def download_config(
    config_file_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    config_file = db.query(ConfigFile).filter(ConfigFile.id == config_file_id).first()
    if not config_file:
        raise HTTPException(status_code=404, detail="Config file not found")

    items = (
        db.query(ConfigItem)
        .filter(ConfigItem.config_file_id == config_file_id)
        .order_by(ConfigItem.key_path)
        .all()
    )

    if not items:
        raise HTTPException(status_code=404, detail="No items found in this config file")

    file_type = config_file.file_type
    enc_service = EncryptionService(db)
    content = export_config(items, file_type, enc_service)

    filename = config_file.filename
    if "." not in filename:
        filename = f"{filename}.{file_type}"

    return Response(
        content=content,
        media_type=MEDIA_TYPE_MAP.get(file_type, "application/octet-stream"),
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )