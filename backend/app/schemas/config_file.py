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