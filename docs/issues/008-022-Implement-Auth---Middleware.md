# [022] Implement Auth - Middleware

**Issue #8 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [021] sudah membuat endpoint login yang mengembalikan JWT. Sekarang kita perlu middleware/auth dependency yang memvalidasi JWT untuk semua endpoint `/api/v1/*` kecuali `/api/v1/auth/*` dan `/health`.

## Goal
Buat middleware FastAPI yang memvalidasi JWT pada setiap request ke endpoint `/api/v1/*`, mengecualikan endpoint auth dan health check. Juga integrasikan role-based access control.

## Steps

### 1. Buat backend/app/middleware/auth_middleware.py
```python
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from app.config import settings

# Path yang tidak perlu autentikasi
PUBLIC_PATHS = {"/api/v1/auth/login", "/api/v1/auth/register", "/health", "/"}


async def auth_middleware(request: Request, call_next):
    path = request.url.path

    # Skip auth untuk public paths
    if path in PUBLIC_PATHS or path.startswith("/api/v1/auth/"):
        return await call_next(request)

    # Skip auth untuk non-API paths
    if not path.startswith("/api/v1/"):
        return await call_next(request)

    # Validasi JWT
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Missing or invalid Authorization header"},
        )

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        request.state.user = payload
    except JWTError:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid or expired token"},
        )

    return await call_next(request)
```

### 2. Buat dependency untuk role checking
```python
# backend/app/middleware/role_checker.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.config import settings

security = HTTPBearer(auto_error=False)


def require_role(required_role: str):
    """
    Dependency factory untuk mengecek role.
    Contoh penggunaan:
        @router.get("/admin", dependencies=[Depends(require_role("admin"))])
    """

    def role_checker(
        credentials: HTTPAuthorizationCredentials = Depends(security),
    ):
        if credentials is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        try:
            payload = jwt.decode(
                credentials.credentials,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
            role = payload.get("role", "")
            if role != required_role and role != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{required_role}' required, but user has role '{role}'",
                )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

    return role_checker
```

### 3. Daftarkan middleware di backend/app/main.py
```python
from app.middleware.auth_middleware import auth_middleware

app.middleware("http")(auth_middleware)
```

Urutan middleware dan router di main.py:
```python
from fastapi import FastAPI
from app.database import engine, SessionLocal, Base
from app.seed import seed_admin
from app.routers import auth
from app.middleware.auth_middleware import auth_middleware

app = FastAPI(title="Config Vault API", version="0.1.0")

# Middleware (harus sebelum router)
app.middleware("http")(auth_middleware)

# Router publik (auth tidak kena middleware)
app.include_router(auth.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_admin(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}
```

### 4. Update .env.example dengan JWT settings
```env
DATABASE_URL=mysql+pymysql://config_vault:config_vault@localhost:3306/config_vault
ENCRYPTION_KEY=<fernet-key>
CORS_ORIGINS=*
JWT_SECRET_KEY=super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

## Verification
- [ ] Request ke `GET /health` tanpa token berhasil (200)
- [ ] Request ke `POST /api/v1/auth/login` tanpa token berhasil (200)
- [ ] Request ke endpoint API lain tanpa token ditolak (401)
- [ ] Request ke endpoint API dengan token valid berhasil (200)
- [ ] Request ke endpoint API dengan token expired/invalid ditolak (401)
- [ ] Role checker: user dengan role viewer tidak bisa akses endpoint admin (403)

## Depends on
#7
