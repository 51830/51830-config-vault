from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class ConfigFile(Base):
    __tablename__ = "config_files"

    id = Column(Integer, primary_key=True, autoincrement=True)
    app_id = Column(Integer, ForeignKey("apps.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)
    version = Column(Integer, nullable=False)
    note = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)