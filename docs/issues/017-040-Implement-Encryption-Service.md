# [040] Implement Encryption Service

**Issue #17 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Semua nilai konfigurasi di Config Vault harus dienkripsi di database (Fernet/AES-256). Issue ini membuat EncryptionService untuk enkripsi/dekripsi value dan key rotation.

## Goal
Buat EncryptionService menggunakan library `cryptography` (Fernet) untuk enkripsi semua value config items, dengan dukungan key rotation.

## Steps

### 1. Tambahkan cryptography ke requirements.txt
```txt
cryptography==42.0.5
```

Jalankan:
```bash
pip install -r backend/requirements.txt
```

### 2. Buat backend/app/services/encryption.py
```python
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session
from app.config import settings
from app.models.encryption_key import EncryptionKey


class EncryptionService:
    def __init__(self, db: Session | None = None):
        self.db = db
        self._active_key: Fernet | None = None
        self._key_map: dict[int, Fernet] = {}

    def _get_active_key(self) -> tuple[int, Fernet]:
        """Dapatkan active key dari DB atau environment variable."""
        if self._active_key is not None:
            return self._active_key

        # Priority: env var ENCRYPTION_KEY
        if settings.ENCRYPTION_KEY:
            key_id = 0
            f = Fernet(settings.ENCRYPTION_KEY.encode())
            self._active_key = (key_id, f)
            self._key_map[key_id] = f
            return self._active_key

        # Fallback: DB encryption_keys table
        if self.db is not None:
            active = (
                self.db.query(EncryptionKey)
                .filter(EncryptionKey.is_active.is_(True))
                .first()
            )
            if active:
                # Hint contains the key in dev (not in prod!)
                key_bytes = active.hint.encode()
                if len(key_bytes) < 32:
                    key_bytes = key_bytes.ljust(32, b"x")
                f = Fernet(base64.urlsafe_b64encode(key_bytes[:32]))
                self._active_key = (active.id, f)
                self._key_map[active.id] = f
                return self._active_key

        raise RuntimeError("No encryption key configured. Set ENCRYPTION_KEY env var.")

    def encrypt(self, value: str) -> tuple[str, int]:
        """Encrypt value dan return (encrypted_string, key_version)."""
        key_id, f = self._get_active_key()
        encrypted = f.encrypt(value.encode()).decode()
        return encrypted, key_id

    def decrypt(self, encrypted_value: str, key_version: int = 0) -> str:
        """Decrypt value dengan key yang sesuai."""
        if key_version in self._key_map:
            f = self._key_map[key_version]
        else:
            # Load key from DB if not in cache
            if self.db is not None and key_version > 0:
                key_entry = (
                    self.db.query(EncryptionKey)
                    .filter(EncryptionKey.id == key_version)
                    .first()
                )
                if key_entry:
                    key_bytes = key_entry.hint.encode().ljust(32, b"x")
                    f = Fernet(base64.urlsafe_b64encode(key_bytes[:32]))
                    self._key_map[key_version] = f
                else:
                    raise ValueError(f"Encryption key version {key_version} not found")
            else:
                # Fallback to env var key
                _, f = self._get_active_key()

        return f.decrypt(encrypted_value.encode()).decode()

    def rotate_key(self, new_key_hint: str) -> int:
        """Rotate encryption key untuk key rotation."""
        if self.db is None:
            raise RuntimeError("DB required for key rotation")

        # Deactivate current active key
        active = (
            self.db.query(EncryptionKey)
            .filter(EncryptionKey.is_active.is_(True))
            .all()
        )
        for k in active:
            k.is_active = False

        # Create new key
        new_key = EncryptionKey(
            version=f"v{len(active) + 1}",
            hint=new_key_hint,
            is_active=True,
        )
        self.db.add(new_key)
        self.db.commit()
        self.db.refresh(new_key)

        # Reset cache
        self._active_key = None
        self._key_map = {}

        return new_key.id
```

### 3. Update backend/app/services/__init__.py
```python
from app.services.encryption import EncryptionService

__all__ = ["EncryptionService"]
```

### 4. Test encryption service
```bash
cd backend
python -c "
import os
os.environ['ENCRYPTION_KEY'] = 'ZGV2LWVuY3J5cHRpb24ta2V5LTEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNA=='  # dummy base64

from app.services.encryption import EncryptionService
svc = EncryptionService()

# Test encrypt/decrypt
encrypted, key_id = svc.encrypt('test-value')
print(f'Encrypted: {encrypted}')
print(f'Key ID: {key_id}')

decrypted = svc.decrypt(encrypted, key_id)
print(f'Decrypted: {decrypted}')
assert decrypted == 'test-value'
print('Encryption: All tests passed')
"
```

## Verification
- [ ] `encrypt('test-value')` mengembalikan string terenkripsi yang berbeda dari aslinya
- [ ] `decrypt(encrypt('test-value'))` mengembalikan `'test-value'`
- [ ] Encrypt value yang sama 2 kali menghasilkan output berbeda (salt)
- [ ] Error handling untuk key yang tidak valid
- [ ] Fungsi rotate_key berhasil membuat key baru

## Depends on
#16
