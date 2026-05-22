from pydantic import BaseModel
from typing import Optional


class ConfigItemResponse(BaseModel):
    id: int
    config_file_id: int
    key_path: str
    value_preview: str
    is_sensitive: bool
    is_selected: bool
    created_at: str

    class Config:
        from_attributes = True


class ConfigItemDetailResponse(BaseModel):
    id: int
    config_file_id: int
    key_path: str
    value: str
    is_sensitive: bool
    is_selected: bool
    key_version: int
    created_at: str


class ConfigItemListResponse(BaseModel):
    total: int
    items: list[ConfigItemResponse]


class ConfigItemUpdate(BaseModel):
    is_selected: Optional[bool] = None
    is_sensitive: Optional[bool] = None


class ConfigItemBulkUpdate(BaseModel):
    selected_keys: list[str]