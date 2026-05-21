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