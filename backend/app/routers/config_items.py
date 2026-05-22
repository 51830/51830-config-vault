from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.config_file import ConfigFile
from app.models.config_item import ConfigItem
from app.schemas.config_item import (
    ConfigItemResponse,
    ConfigItemDetailResponse,
    ConfigItemListResponse,
    ConfigItemUpdate,
    ConfigItemBulkUpdate,
)
from app.services.encryption import EncryptionService
from app.middleware.role_checker import require_role

router = APIRouter(prefix="/api/v1/configs", tags=["config_items"])


@router.get("/{config_id}/items", response_model=ConfigItemListResponse)
def list_config_items(
    config_id: int,
    page: int = 1,
    per_page: int = 100,
    selected_only: bool = Query(False, alias="selected_only"),
    db: Session = Depends(get_db),
):
    cf = db.query(ConfigFile).filter(ConfigFile.id == config_id).first()
    if not cf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config file not found",
        )

    query = db.query(ConfigItem).filter(ConfigItem.config_file_id == config_id)
    if selected_only:
        query = query.filter(ConfigItem.is_selected.is_(True))

    total = query.count()
    items = (
        query.order_by(ConfigItem.key_path)
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return ConfigItemListResponse(
        total=total,
        items=[
            ConfigItemResponse(
                id=item.id,
                config_file_id=item.config_file_id,
                key_path=item.key_path,
                value_preview="***" if item.is_sensitive else "encrypted",
                is_sensitive=item.is_sensitive,
                is_selected=item.is_selected,
                created_at=str(item.created_at) if item.created_at else "",
            )
            for item in items
        ],
    )


@router.get("/items/{item_id}", response_model=ConfigItemDetailResponse)
def get_config_item(
    item_id: int,
    decrypt: bool = Query(False),
    db: Session = Depends(get_db),
    _=Depends(require_role("editor")),
):
    item = db.query(ConfigItem).filter(ConfigItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config item not found",
        )

    value = item.value_encrypted
    if decrypt:
        enc_service = EncryptionService(db)
        value = enc_service.decrypt(item.value_encrypted, item.key_version or 0)

    return ConfigItemDetailResponse(
        id=item.id,
        config_file_id=item.config_file_id,
        key_path=item.key_path,
        value=value,
        is_sensitive=item.is_sensitive,
        is_selected=item.is_selected,
        key_version=item.key_version or 0,
        created_at=str(item.created_at) if item.created_at else "",
    )


@router.put("/items/{item_id}", response_model=ConfigItemResponse)
def update_config_item(
    item_id: int,
    data: ConfigItemUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role("editor")),
):
    item = db.query(ConfigItem).filter(ConfigItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config item not found",
        )

    if data.is_selected is not None:
        item.is_selected = data.is_selected
    if data.is_sensitive is not None:
        item.is_sensitive = data.is_sensitive

    db.commit()
    db.refresh(item)

    return ConfigItemResponse(
        id=item.id,
        config_file_id=item.config_file_id,
        key_path=item.key_path,
        value_preview="***" if item.is_sensitive else "encrypted",
        is_sensitive=item.is_sensitive,
        is_selected=item.is_selected,
        created_at=str(item.created_at) if item.created_at else "",
    )


@router.put("/{config_id}/items/bulk-select", response_model=dict)
def bulk_select_items(
    config_id: int,
    data: ConfigItemBulkUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role("editor")),
):
    cf = db.query(ConfigFile).filter(ConfigFile.id == config_id).first()
    if not cf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config file not found",
        )

    # Set all to not selected
    db.query(ConfigItem).filter(
        ConfigItem.config_file_id == config_id
    ).update({"is_selected": False})

    # Set selected keys
    if data.selected_keys:
        db.query(ConfigItem).filter(
            ConfigItem.config_file_id == config_id,
            ConfigItem.key_path.in_(data.selected_keys),
        ).update({"is_selected": True}, synchronize_session=False)

    db.commit()

    selected_count = (
        db.query(ConfigItem)
        .filter(
            ConfigItem.config_file_id == config_id,
            ConfigItem.is_selected.is_(True),
        )
        .count()
    )

    return {"updated": True, "selected_count": selected_count}