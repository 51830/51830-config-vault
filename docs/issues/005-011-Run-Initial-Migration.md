# [011] Run Initial Migration

**Issue #5 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [010] sudah membuat semua SQLAlchemy model. Sekarang kita perlu menyiapkan Alembic dan menjalankan migration untuk membuat tabel-tabel di database MySQL.

## Goal
Setup Alembic, buat migration script, dan jalankan initial migration untuk membuat 5 tabel: `apps`, `config_files`, `config_items`, `encryption_keys`, dan `users`.

## Steps

### 1. Install alembic
Tambahkan `alembic` ke `backend/requirements.txt`:

```txt
alembic==1.13.1
```

Lalu jalankan:
```bash
pip install -r backend/requirements.txt
```

### 2. Inisialisasi Alembic
Jalankan dari folder `backend/`:
```bash
cd backend
alembic init migrations
```

Ini akan membuat:
- `backend/migrations/` folder
- `backend/migrations/env.py`
- `backend/migrations/script.py.mako`
- `backend/alembic.ini`

### 3. Konfigurasi database URL di alembic.ini
Edit `backend/alembic.ini`, ubah baris:
```ini
sqlalchemy.url = driver://user:pass@localhost/dbname
```
menjadi:
```ini
sqlalchemy.url = mysql+pymysql://config_vault:config_vault@localhost:3306/config_vault
```

### 4. Konfigurasi env.py untuk auto-detection
Edit `backend/migrations/env.py`:

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[2]))

from app.database import Base
from app.models import App, ConfigFile, ConfigItem, EncryptionKey, User

target_metadata = Base.metadata
```

### 5. Buat initial migration
```bash
cd backend
alembic revision --autogenerate -m "initial_migration"
```

### 6. Periksa hasil migration
Buka file migration yang baru dibuat di `backend/migrations/versions/`. Pastikan isinya mengandung operasi `op.create_table()` untuk 5 tabel:
- `apps`
- `config_files`
- `config_items`
- `encryption_keys`
- `users`

### 7. Jalankan migration
```bash
cd backend
alembic upgrade head
```

### 8. Verifikasi di MySQL
Masuk ke MySQL container dan cek apakah tabel sudah terbuat:
```bash
docker exec -it config-vault-mysql mysql -u config_vault -p
```
```sql
USE config_vault;
SHOW TABLES;
DESCRIBE apps;
DESCRIBE config_files;
DESCRIBE config_items;
DESCRIBE encryption_keys;
DESCRIBE users;
```

## Verification
- [ ] `alembic upgrade head` berhasil tanpa error
- [ ] 5 tabel (apps, config_files, config_items, encryption_keys, users) muncul di MySQL
- [ ] Setiap tabel memiliki kolom sesuai dengan ARCHITECTURE.md
- [ ] Foreign key terdefinisi dengan benar
- [ ] `alembic downgrade -1` bisa jalan tanpa error (opsional)

## Depends on
#4
