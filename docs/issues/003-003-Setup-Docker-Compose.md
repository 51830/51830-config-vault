# [003] Setup Docker Compose

**Issue #3 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

## Goal
Buat file `docker-compose.yml` dan `docker-compose.override.yml` untuk menjalankan backend (FastAPI), frontend (React/Vite), dan database (MySQL 8) secara lokal.

## Steps

### 1. Buat docker-compose.yml
Buat file `docker-compose.yml` di root project dengan 3 service:

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - ./backend:/app
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - config-vault-net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - config-vault-net

  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: config_vault
      MYSQL_USER: user
      MYSQL_PASSWORD: pass
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - config-vault-net

volumes:
  mysql-data:

networks:
  config-vault-net:
    driver: bridge
```

### 2. Buat docker-compose.override.yml
Buat file `docker-compose.override.yml` untuk development override:

```yaml
services:
  backend:
    environment:
      - UVICORN_RELOAD=true
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Buat .env.example
Buat file `.env.example` sebagai template environment variables:

```
# Database
DATABASE_URL=mysql+pymysql://user:pass@mysql:3306/config_vault

# Encryption
ENCRYPTION_KEY=

# JWT
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# CORS
CORS_ORIGINS=http://localhost:5173
```

### 4. Update .gitignore
Pastikan `.env` ada di `.gitignore`:

```
.env
__pycache__/
node_modules/
*.pyc
.DS_Store
```

## Verification
- [ ] Jalankan `docker compose up -d` dari root project
- [ ] Akses `http://localhost:8000/health` â€” harus return `{"status":"ok"}`
- [ ] Akses `http://localhost:5173` â€” harus muncul halaman frontend
- [ ] MySQL bisa diakses di `localhost:3306` dengan user/pass yang sudah ditentukan
- [ ] Matikan dengan `docker compose down`

## Depends on
#1, #2
