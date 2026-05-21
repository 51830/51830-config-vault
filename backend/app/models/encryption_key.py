from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class EncryptionKey(Base):
    __tablename__ = "encryption_keys"

    id = Column(Integer, primary_key=True, autoincrement=True)
    version = Column(String(20), nullable=False)
    hint = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    rotated_at = Column(DateTime, nullable=True)