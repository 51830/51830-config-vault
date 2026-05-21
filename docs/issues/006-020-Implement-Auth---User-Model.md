# [020] Implement Auth - User Model

**Issue #6 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [010] sudah membuat SQLAlchemy model `User`, dan [011] sudah menjalankan migration. Sekarang kita perlu membuat service layer untuk user: register, login verification, password hashing dengan bcrypt, dan manajemen user (CRUD).

## Goal
Buat service auth untuk user: password hashing (bcrypt), user CRUD, dan seed user default admin.

## Steps

### 1. Tambahkan dependensi ke requirements.txt
Tambahkan ke `backend/requirements.txt`:
```txt
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
```

Jalankan:
```bash
pip install -r backend/requirements.txt
```

### 2. Buat backend/app/services/auth_service.py
```python
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.user_model import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def create_user(
    db: Session, username: str, password: str, role: str = "viewer"
) -> User:
    existing = get_user_by_username(db, username)
    if existing:
        raise ValueError(f"Username '{username}' already exists")

    user = User(
        username=username,
        password_hash=hash_password(password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_all_users(db: Session) -> list[User]:
    return db.query(User).all()


def update_user_role(db: Session, user_id: int, new_role: str) -> User | None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    if new_role not in ("admin", "editor", "viewer"):
        raise ValueError(f"Invalid role: {new_role}")
    user.role = new_role
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True
```

### 3. Buat seed script backend/app/seed.py
Buat script untuk membuat user admin default saat pertama kali aplikasi dijalankan:

```python
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.auth_service import get_user_by_username, create_user


def seed_admin(db: Session) -> None:
    admin = get_user_by_username(db, "admin")
    if admin:
        return
    create_user(db, username="admin", password="admin123", role="admin")
    print("Default admin user created (username=admin, password=admin123)")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_admin(db)
    finally:
        db.close()
```

### 4. Panggil seed di startup (backend/app/main.py)
```python
from app.database import engine, SessionLocal, Base
from app.seed import seed_admin


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_admin(db)
    finally:
        db.close()
```

## Verification
- [ ] `python -c "from app.services.auth_service import hash_password, verify_password; print(verify_password('test', hash_password('test')))"` mencetak `True`
- [ ] `python -c "from app.services.auth_service import hash_password, verify_password; print(verify_password('wrong', hash_password('test')))"` mencetak `False`
- [ ] `python seed.py` berhasil tanpa error
- [ ] User admin (username=admin, password=admin123) terbuat di database

## Depends on
#5
