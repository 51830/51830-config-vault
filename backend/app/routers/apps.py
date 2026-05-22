from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.app_model import App
from app.schemas.app_schema import AppCreate, AppUpdate, AppResponse, AppListResponse
from app.middleware.role_checker import require_role

router = APIRouter(prefix="/api/v1/apps", tags=["apps"])


def _slugify(name: str) -> str:
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
    base_slug = slug
    counter = 1
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