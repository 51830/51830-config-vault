# Config Vault - Panduan untuk Claude Code

## Cara Menjalankan Project

Semua service berjalan di **Docker Compose**. Jangan pernah menjalankan Python langsung di local PC.

```bash
# Start semua service
docker compose up -d

# Start ulang dengan build (setelah ada perubahan dependensi)
docker compose up --build -d backend

# Restart container saja (setelah perubahan file Python, tanpa dependensi baru)
docker compose restart backend
```

## Service & Port

| Service | Port | Deskripsi |
|---------|------|-----------|
| backend | 8000 | FastAPI (uvicorn --reload) |
| frontend | 5173 | Vite dev server |
| mysql | 3306 | MySQL 8 |

## Perintah Penting

### Python di Container
```bash
docker compose exec backend python -c "print('hello')"
docker compose exec backend python -m app.seed    # BUKAN python app/seed.py
docker compose exec backend python -m alembic upgrade head
```

### API Testing
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
```

### Logs
```bash
docker compose logs backend
docker compose logs backend -f    # follow mode
```

## Struktur Folder

```
backend/app/
├── main.py              # Entry point FastAPI
├── config.py            # Settings via pydantic-settings
├── database.py          # SQLAlchemy engine + session
├── models/              # SQLAlchemy models
├── schemas/             # Pydantic schemas
├── routers/             # FastAPI routers
├── services/            # Business logic
├── middleware/           # Auth middleware
├── parsers/             # Config file parsers
└── seed.py              # DB seeder
```

## Workflow GitHub Issue

1. Baca isi issue dengan `gh issue view <number>`
2. Implementasi sesuai steps di issue
3. Rebuild/restart container jika perlu
4. Verifikasi dengan perintah di bagian Verification issue
5. **WAJIB: update comment di GitHub issue dengan checklist hasil verifikasi** — setiap item yang lulus diubah dari `- [ ]` menjadi `- [x]`, gunakan `gh issue comment <number> --body "..."` dengan isi comment berisi checklist yang sudah dicentang
6. **WAJIB: git add, git commit, git push ke origin/main**
6. **WAJIB: tutup issue dengan `gh issue close <number> -c "..."`**

## Catatan Khusus

- Dependency baru: edit `backend/requirements.txt`, lalu `docker compose up --build -d backend`
- Environment variables: ada di `.env` (copy dari `.env.example`)
- Migration: menggunakan Alembic, jalankan via `docker compose exec backend python -m alembic ...`