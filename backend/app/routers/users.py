from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth_schema import UserResponse
from app.services.auth_service import (
    get_all_users,
    create_user as create_user_service,
    update_user_role as update_user_role_service,
    delete_user as delete_user_service,
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only endpoint",
        )
    users = get_all_users(db)
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            created_at=str(user.created_at) if user.created_at else None,
            last_login=str(user.last_login) if user.last_login else None,
        )
        for user in users
    ]


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str = "viewer"


@router.post("", response_model=UserResponse)
def create_user(
    request: CreateUserRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only endpoint",
        )
    try:
        user = create_user_service(db, request.username, request.password, request.role)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        created_at=str(user.created_at) if user.created_at else None,
        last_login=str(user.last_login) if user.last_login else None,
    )


class UpdateUserRoleRequest(BaseModel):
    role: str


@router.put("/{user_id}", response_model=UserResponse)
def update_user_role(
    user_id: int,
    request: UpdateUserRoleRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only endpoint",
        )
    try:
        user = update_user_role_service(db, user_id, request.role)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        created_at=str(user.created_at) if user.created_at else None,
        last_login=str(user.last_login) if user.last_login else None,
    )


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only endpoint",
        )
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )
    success = delete_user_service(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return {"message": "User deleted successfully"}