# [050] Implement Apps API

**Issue #18 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [040] sudah membuat EncryptionService. Sekarang kita perlu membuat REST API untuk CRUD aplikasi (tabel `apps`).

## Goal
Buat endpoint CRUD untuk Apps: `GET/POST /api/v1/apps`, `GET/PUT/DELETE /api/v1/apps/{id}`.

## Steps

### 1. Buat backend/app/schemas/app_schema.py
```python
from pydantic import BaseModel
from typing import Optional


class AppCreate(BaseModel):
    name: str
    description: Optional[str] = None
    note: Optional[str] = None


class AppUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    note: Optional[str] = None


class AppResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    note: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class AppListResponse(BaseModel):
    total: int
    items: list[AppResponse]
```

### 2. Buat backend/app/routers/apps.py
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.app_model import App
from app.schemas.app_schema import AppCreate, AppUpdate, AppResponse, AppListResponse
from app.middleware.role_checker import require_role

router = APIRouter(prefix="/api/v1/apps", tags=["apps"])


def _slugify(name: str) -> str:
    """Convert name to URL-friendly slug."""
    import re
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug.strip("-")


@router.get("", response_model=AppListResponse)
def list_apps(
    page: int = 1,
    per_page: int = 20,
    search: str = "",
    db: Session = Depends(get_db),
):
    query = db.query(App)
    if search:
        query = query.filter(App.name.ilike(f"%{search}%"))
    total = query.count()
    items = (
        query.order_by(App.updated_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return AppListResponse(
        total=total,
        items=[
            AppResponse(
                id=a.id,
                name=a.name,
                slug=a.slug,
                description=a.description,
                note=a.note,
                created_at=str(a.created_at) if a.created_at else "",
                updated_at=str(a.updated_at) if a.updated_at else "",
            )
            for a in items
        ],
    )


@router.post("", response_model=AppResponse, status_code=status.HTTP_201_CREATED)
def create_app(
    data: AppCreate,
    db: Session = Depends(get_db),
    _=Depends(require_role("editor")),
):
    existing = db.query(App).filter(App.name == data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"App with name '{data.name}' already exists",
        )

    slug = _slugify(data.name)
    # Ensure unique slug
    counter = 1
    base_slug = slug
    while db.query(App).filter(App.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    app = App(
        name=data.name,
        slug=slug,
        description=data.description,
        note=data.note,
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    return AppResponse(
        id=app.id,
        name=app.name,
        slug=app.slug,
        description=app.description,
        note=app.note,
        created_at=str(app.created_at) if app.created_at else "",
        updated_at=str(app.updated_at) if app.updated_at else "",
    )


@router.get("/{app_id}", response_model=AppResponse)
def get_app(app_id: int, db: Session = Depends(get_db)):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found",
        )
    return AppResponse(
        id=app.id,
        name=app.name,
        slug=app.slug,
        description=app.description,
        note=app.note,
        created_at=str(app.created_at) if app.created_at else "",
        updated_at=str(app.updated_at) if app.updated_at else "",
    )


@router.put("/{app_id}", response_model=AppResponse)
def update_app(
    app_id: int,
    data: AppUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role("editor")),
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found",
        )

    if data.name is not None:
        app.name = data.name
        app.slug = _slugify(data.name)
    if data.description is not None:
        app.description = data.description
    if data.note is not None:
        app.note = data.note

    db.commit()
    db.refresh(app)

    return AppResponse(
        id=app.id,
        name=app.name,
        slug=app.slug,
        description=app.description,
        note=app.note,
        created_at=str(app.created_at) if app.created_at else "",
        updated_at=str(app.updated_at) if app.updated_at else "",
    )


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_app(
    app_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin")),
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="App not found",
        )
    db.delete(app)
    db.commit()
```

### 3. Register router di main.py
```python
from app.routers import apps
app.include_router(apps.router)
```

## Verification
- [ ] `GET /api/v1/apps` mengembalikan list apps (bisa kosong)
- [ ] `POST /api/v1/apps` dengan body JSON berhasil membuat app baru (201)
- [ ] `POST /api/v1/apps` dengan nama duplicate mengembalikan 409
- [ ] `GET /api/v1/apps/{id}` mengembalikan detail app
- [ ] `PUT /api/v1/apps/{id}` berhasil update app
- [ ] `DELETE /api/v1/apps/{id}` berhasil delete app (204)
- [ ] `GET /api/v1/apps/{id}` untuk ID tidak ada mengembalikan 404
- [ ] `GET /api/v1/apps?search=xxx` memfilter berdasarkan nama

## Depends on
#17
