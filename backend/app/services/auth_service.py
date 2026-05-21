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