from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class ConfigItem(Base):
    __tablename__ = "config_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    config_file_id = Column(Integer, ForeignKey("config_files.id"), nullable=False, index=True)
    key_path = Column(String(500), nullable=False)
    value_encrypted = Column(Text, nullable=False)
    is_sensitive = Column(Boolean, default=False, nullable=False)
    is_selected = Column(Boolean, default=False, nullable=False)
    key_version = Column(Integer, ForeignKey("encryption_keys.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)