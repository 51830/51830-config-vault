# ARCHITECTURE.md — 51830-config-vault

Dokumen ini adalah source of truth untuk semua keputusan arsitektur aplikasi.
Wajib dibaca sebelum mengerjakan issue apapun.

---

## Deskripsi Aplikasi

**Config Vault** adalah centralized configuration management system.
Aplikasi membaca file konfigurasi dari berbagai format, menyimpan key-value
pair ke MySQL, dengan fitur versioning, enkripsi nilai sensitif, dan export
balik ke format aslinya.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy, Alembic, PyMySQL |
| Frontend | React, Vite (build only), Nginx, Axios, Zustand, TanStack Table, react-diff-viewer, React Hook Form |
| Database | MySQL 8 |
| Enkripsi | cryptography (Fernet / AES-256) |
| Package manager | npm |
| Dev environment | Docker Compose |
| Prod environment | Kubernetes |

---

## Arsitektur: 2 Service Terpisah

```
Browser → Ingress → frontend (Nginx + React build)
                 → backend  (Nginx + FastAPI)
                              ↓
                           MySQL
```

- Frontend dan backend adalah **2 deployment terpisah** di Kubernetes
- Komunikasi frontend ke backend via **REST API (JSON)**
- Di dev, keduanya dijalankan via **Docker Compose**

---

## Struktur Folder

```
51830-config-vault/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── app_model.py
│   │   │   ├── config_file.py
│   │   │   ├── config_item.py
│   │   │   └── encryption_key.py
│   │   ├── schemas/
│   │   │   ├── app_schema.py
│   │   │   ├── config_file.py
│   │   │   └── config_item.py
│   │   ├── routers/
│   │   │   ├── apps.py
│   │   │   ├── configs.py
│   │   │   └── config_items.py
│   │   ├── services/
│   │   │   ├── encryption.py
│   │   │   └── versioning.py
│   │   └── parsers/
│   │       ├── base.py
│   │       ├── registry.py
│   │       ├── env_parser.py
│   │       ├── json_parser.py
│   │       ├── yaml_parser.py
│   │       ├── toml_parser.py
│   │       ├── ini_parser.py
│   │       └── php_parser.py
│   ├── migrations/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── AppsPage.jsx
│   │   │   ├── AppDetailPage.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   ├── ConfigReviewPage.jsx
│   │   │   └── DiffPage.jsx
│   │   ├── components/
│   │   │   ├── KeyValueTable.jsx
│   │   │   ├── VersionTimeline.jsx
│   │   │   ├── DiffViewer.jsx
│   │   │   └── SensitiveBadge.jsx
│   │   ├── api/
│   │   │   └── client.js
│   │   └── store/
│   │       └── useAppStore.js
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── nginx.conf
│   └── package.json
├── k8s/
│   ├── frontend-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── mysql-statefulset.yaml
│   ├── ingress.yaml
│   └── secrets.yaml
├── docker-compose.yml
├── docker-compose.override.yml
├── .env.example
└── docs/
    ├── ARCHITECTURE.md   ← file ini
    └── issues/
```

---

## Database Schema

### Tabel `apps`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| name | VARCHAR(100) | Nama aplikasi |
| slug | VARCHAR(100) UNIQUE | URL-friendly name |
| description | TEXT | Deskripsi aplikasi |
| note | TEXT | Catatan bebas |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### Tabel `config_files`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| app_id | INT FK → apps.id | |
| filename | VARCHAR(255) | Nama file asli |
| file_type | VARCHAR(20) | env, json, yaml, toml, ini, php |
| version | INT | Auto-increment per app (v1, v2, v3...) |
| note | TEXT | Catatan untuk versi ini |
| uploaded_at | DATETIME | |

### Tabel `config_items`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| config_file_id | INT FK → config_files.id | |
| key_path | VARCHAR(500) | Dot-notation: `database.host` |
| value_encrypted | TEXT | Selalu dienkripsi |
| is_sensitive | BOOLEAN | Auto-detect dari keyword |
| is_selected | BOOLEAN | Dipilih user untuk disimpan |
| key_version | INT FK → encryption_keys.id | Untuk key rotation |
| created_at | DATETIME | |

### Tabel `encryption_keys`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| version | VARCHAR(20) | e.g. "v1", "v2" |
| hint | VARCHAR(100) | Deskripsi key (bukan key aslinya) |
| is_active | BOOLEAN | Hanya satu yang aktif |
| created_at | DATETIME | |
| rotated_at | DATETIME | Nullable |

---

## Enkripsi

- Library: `cryptography` — Fernet (AES-128-CBC + HMAC-SHA256, production-safe)
- **Semua value dienkripsi**, tidak hanya yang sensitif
- `is_sensitive` hanya flag untuk UI (tampilkan sebagai `***` by default)
- Key disimpan di environment variable `ENCRYPTION_KEY`
- Dev: nilai key ada di `.env` file
- Prod: nilai key ada di Kubernetes Secret
- Key rotation: `config_items.key_version` menunjuk ke `encryption_keys.id`

### Keyword auto-detect sensitive:
`password`, `passwd`, `secret`, `token`, `key`, `api_key`, `private`,
`credential`, `auth`, `access_key`, `secret_key`

---

## Parser

Arsitektur plugin-style dengan interface `BaseParser`:

```python
class BaseParser:
    def can_parse(self, filename: str) -> bool: ...
    def parse(self, content: str) -> dict[str, str]: ...
```

### Format yang didukung:
| Parser | Ekstensi |
|---|---|
| EnvParser | `.env`, `.env.*` |
| JsonParser | `.json` |
| YamlParser | `.yml`, `.yaml` |
| TomlParser | `.toml` |
| IniParser | `.ini`, `.cfg` |
| PhpParser | `.php` |

Nested key di-flatten ke dot-notation: `{"db": {"host": "localhost"}}` → `db.host`

---

## CORS

Sementara allow all (`*`). Akan diganti setelah domain production ditentukan.

---

## Autentikasi & Authorization

- **Mekanisme**: JWT (JSON Web Token) via `python-jose`
- **Login**: endpoint `/api/v1/auth/login` — menerima username/password, return JWT
- **Token**: expired dalam 24 jam, simpan di localStorage frontend
- **Middleware**: semua endpoint `/api/v1/` (kecuali `/auth/*` dan `/health`) require valid JWT
- **Password**: di-hash dengan bcrypt sebelum disimpan di database

### Tabel `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| username | VARCHAR(50) UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt hash |
| role | ENUM('admin', 'viewer') | |
| created_at | DATETIME | |
| last_login | DATETIME | Nullable |

### Role & Permission
| Role | Aktivitas |
|---|---|
| admin | Upload config, edit, delete, manage users |
| editor | Upload config, edit, delete (tanpa manage users) |
| viewer | View only, export config |

### Environment Variables
```
JWT_SECRET_KEY=<random-secret>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

---

## Environment Variables

### Backend
```
DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/config_vault
ENCRYPTION_KEY=<fernet-key>
CORS_ORIGINS=*
```

### Frontend
```
VITE_API_URL=http://localhost:8000
```

---

## Dev vs Production

| | Dev | Prod |
|---|---|---|
| Jalankan dengan | `docker compose up` | Kubernetes |
| Frontend serve | Nginx + React build | Nginx + React build |
| Backend | Uvicorn `--reload` | Uvicorn (workers) |
| Database | MySQL container | MySQL StatefulSet |
| Config | `.env` file | K8s Secret + ConfigMap |
| Port frontend | 3000 | 80/443 via Ingress |
| Port backend | 8000 | Internal ClusterIP |

---

## Konvensi Kode

- Backend: snake_case, PEP8
- Frontend: camelCase untuk variabel/fungsi, PascalCase untuk komponen
- API response selalu JSON
- Error response format: `{ "detail": "pesan error" }`
- Semua endpoint backend berawalan `/api/v1/`