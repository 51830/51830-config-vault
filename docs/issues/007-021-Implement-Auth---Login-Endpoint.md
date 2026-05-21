# [021] Implement Auth - Login Endpoint

**Issue #7 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [020] sudah membuat service auth (password hashing, user CRUD). Sekarang kita perlu membuat endpoint REST untuk login yang menerima username/password dan mengembalikan JWT token.

## Goal
Buat endpoint `POST /api/v1/auth/login` yang menerima username/password, memverifikasi dengan bcrypt, dan mengembalikan JWT token. Juga buat endpoint `GET /api/v1/auth/me` untuk mendapatkan informasi user saat ini.

## Steps

### 1. Buat backend/app/schemas/auth_schema.py
```python
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    created_at: str | None = None
    last_login: str | None = None
```

### 2. Buat backend/app/routers/auth.py
```python
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.schemas.auth_schema import LoginRequest, LoginResponse, UserResponse
from app.services.auth_service import verify_password, get_user_by_username

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user = get_user_by_username(db, username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_username(db, request.username)
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return LoginResponse(
        access_token=access_token,
        username=user.username,
        role=user.role,
    )


@router.get("/me", response_model=UserResponse)
def me(current_user=Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        created_at=str(current_user.created_at) if current_user.created_at else None,
        last_login=str(current_user.last_login) if current_user.last_login else None,
    )
```

### 3. Tambahkan JWT settings ke backend/app/config.py
Pastikan file `backend/app/config.py` memiliki konfigurasi berikut:

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://config_vault:config_vault@localhost:3306/config_vault"
    ENCRYPTION_KEY: str = ""
    CORS_ORIGINS: str = "*"
    JWT_SECRET_KEY: str = "super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"


settings = Settings()
```

### 4. Register router di backend/app/main.py
```python
from app.routers import auth

app.include_router(auth.router)
```

## Verification
- [ ] `curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'` mengembalikan JSON dengan `access_token`
- [ ] Login dengan password salah mengembalikan HTTP 401
- [ ] `curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/auth/me` mengembalikan data user
- [ ] Token expired ditolak dengan HTTP 401

## Depends on
#6
