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