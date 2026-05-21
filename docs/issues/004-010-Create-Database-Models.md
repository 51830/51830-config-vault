# [010] Create Database Models

**Issue #4 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan. Lihat tabel database di arsitektur untuk detail kolom.

## Goal
Buat semua SQLAlchemy model: `App`, `ConfigFile`, `ConfigItem`, `EncryptionKey`, dan `User`.

## Steps

### 1. Buat folder models
Buat folder `backend/app/models/` dengan file `__init__.py`.

### 2. Buat file backend/app/models/app_model.py
```python
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class App(Base):
    __tablename__ = "apps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
```

### 3. Buat file config_file.py
```python
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
```

### 4. Buat file config_item.py
```python
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
```

### 5. Buat file encryption_key.py
```python
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
```

### 6. Buat file user_model.py
```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="viewer")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    last_login = Column(DateTime, nullable=True)
```

### 7. Update __init__.py
```python
from app.models.app_model import App
from app.models.config_file import ConfigFile
from app.models.config_item import ConfigItem
from app.models.encryption_key import EncryptionKey
from app.models.user_model import User

__all__ = ["App", "ConfigFile", "ConfigItem", "EncryptionKey", "User"]
```

## Verification
- [ ] Import semua model di Python shell: `from app.models import App, ConfigFile, ConfigItem, EncryptionKey, User`
- [ ] Pastikan tidak ada syntax error
- [ ] Base.metadata.tables harus berisi 5 tabel

## Depends on
#3
