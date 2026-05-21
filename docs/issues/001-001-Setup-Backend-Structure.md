# [001] Setup Backend Structure

**Issue #1 | Status: CLOSED**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

## Goal
Buat struktur folder dan file dasar untuk backend FastAPI.

## Steps

### 1. Buat folder structure
Buat struktur berikut di dalam folder `backend/`:

```
backend/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ __init__.py
â”‚   â”œâ”€â”€ main.py
â”‚   â”œâ”€â”€ config.py
â”‚   â””â”€â”€ database.py
â”œâ”€â”€ migrations/
â”œâ”€â”€ tests/
â”œâ”€â”€ Dockerfile
â”œâ”€â”€ Dockerfile.dev
â””â”€â”€ requirements.txt
```

### 2. File requirements.txt
Isi dependencies:
```
fastapi==0.115.0
uvicorn[standard]==0.32.0
sqlalchemy==2.0.35
alembic==1.14.0
pymysql==1.1.1
python-jose[cryptography]==3.3.0
bcrypt==4.2.0
pydantic==2.9.2
pydantic-settings==2.6.0
python-multipart==0.0.12
cryptography==43.0.0
pyyaml==6.0.2
toml==0.10.2
python-dotenv==1.0.1
```

### 3. File config.py
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://user:pass@localhost:3306/config_vault"
    ENCRYPTION_KEY: str
    CORS_ORIGINS: str = "*"
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"

settings = Settings()
```

### 4. File database.py
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 5. File main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

app = FastAPI(title="Config Vault API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}
```

### 6. Buat Dockerfile
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 7. Buat Dockerfile.dev
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

## Verification
- [ ] Jalankan `cd backend && pip install -r requirements.txt`
- [ ] Jalankan `uvicorn app.main:app --reload`
- [ ] Akses `http://localhost:8000/health` â€” harus return `{"status":"ok"}`

## Depends on
None
