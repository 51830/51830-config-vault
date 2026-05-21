# [053] Implement Versioning Service

**Issue #19 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Setiap kali user upload file config untuk suatu aplikasi, versioning service harus menentukan versi berikutnya (auto-increment per app) dan tracking riwayat.

## Goal
Buat VersioningService yang mengelola auto-increment version per aplikasi dan riwayat config_files.

## Steps

### 1. Buat backend/app/services/versioning.py
```python
from sqlalchemy.orm import Session
from app.models.config_file import ConfigFile
from app.models.app_model import App


class VersioningService:
    def __init__(self, db: Session):
        self.db = db

    def get_next_version(self, app_id: int) -> int:
        """Dapatkan nomor versi berikutnya untuk suatu aplikasi.

        Versi dihitung per aplikasi (auto-increment).
        """
        latest = (
            self.db.query(ConfigFile)
            .filter(ConfigFile.app_id == app_id)
            .order_by(ConfigFile.version.desc())
            .first()
        )
        if latest is None:
            return 1
        return latest.version + 1

    def get_version_history(self, app_id: int) -> list[ConfigFile]:
        """Dapatkan riwayat semua versi config untuk suatu aplikasi."""
        return (
            self.db.query(ConfigFile)
            .filter(ConfigFile.app_id == app_id)
            .order_by(ConfigFile.version.desc())
            .all()
        )

    def get_version(self, app_id: int, version: int) -> ConfigFile | None:
        """Dapatkan config file spesifik berdasarkan app_id dan version."""
        return (
            self.db.query(ConfigFile)
            .filter(
                ConfigFile.app_id == app_id,
                ConfigFile.version == version,
            )
            .first()
        )

    def get_latest_version(self, app_id: int) -> ConfigFile | None:
        """Dapatkan config file versi terbaru untuk suatu aplikasi."""
        return (
            self.db.query(ConfigFile)
            .filter(ConfigFile.app_id == app_id)
            .order_by(ConfigFile.version.desc())
            .first()
        )

    def count_versions(self, app_id: int) -> int:
        """Hitung jumlah versi config untuk suatu aplikasi."""
        return (
            self.db.query(ConfigFile)
            .filter(ConfigFile.app_id == app_id)
            .count()
        )
```

### 2. Buat backend/app/services/__init__.py
```python
from app.services.encryption import EncryptionService
from app.services.versioning import VersioningService

__all__ = ["EncryptionService", "VersioningService"]
```

### 3. Test versioning
```bash
cd backend
python -c "
from app.services.versioning import VersioningService
# Test logic: next version dimulai dari 1 jika belum ada
print('Versioning service module loaded successfully')
"
```

## Verification
- [ ] `get_next_version()` mengembalikan 1 untuk app pertama kali
- [ ] `get_version_history()` mengembalikan list diurutkan descending
- [ ] `get_latest_version()` mengembalikan versi terbaru
- [ ] `count_versions()` mengembalikan jumlah versi yang benar

## Depends on
#17
