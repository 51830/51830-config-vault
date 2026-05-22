import base64

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
        if self._active_key is not None:
            return self._active_key

        if settings.ENCRYPTION_KEY:
            key_id = 0
            f = Fernet(settings.ENCRYPTION_KEY.encode())
            self._active_key = (key_id, f)
            self._key_map[key_id] = f
            return self._active_key

        if self.db is not None:
            active = (
                self.db.query(EncryptionKey)
                .filter(EncryptionKey.is_active.is_(True))
                .first()
            )
            if active:
                key_bytes = active.hint.encode()
                if len(key_bytes) < 32:
                    key_bytes = key_bytes.ljust(32, b"x")
                f = Fernet(base64.urlsafe_b64encode(key_bytes[:32]))
                self._active_key = (active.id, f)
                self._key_map[active.id] = f
                return self._active_key

        raise RuntimeError("No encryption key configured. Set ENCRYPTION_KEY env var.")

    def encrypt(self, value: str) -> tuple[str, int]:
        key_id, f = self._get_active_key()
        encrypted = f.encrypt(value.encode()).decode()
        return encrypted, key_id

    def decrypt(self, encrypted_value: str, key_version: int = 0) -> str:
        if key_version in self._key_map:
            f = self._key_map[key_version]
        else:
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
                _, f = self._get_active_key()

        return f.decrypt(encrypted_value.encode()).decode()

    def rotate_key(self, new_key_hint: str) -> int:
        if self.db is None:
            raise RuntimeError("DB required for key rotation")

        active = (
            self.db.query(EncryptionKey)
            .filter(EncryptionKey.is_active.is_(True))
            .all()
        )
        for k in active:
            k.is_active = False

        new_key = EncryptionKey(
            version=f"v{len(active) + 1}",
            hint=new_key_hint,
            is_active=True,
        )
        self.db.add(new_key)
        self.db.commit()
        self.db.refresh(new_key)

        self._active_key = None
        self._key_map = {}

        return new_key.id