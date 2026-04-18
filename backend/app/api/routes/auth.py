from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.schemas.auth import LoginRequest, MessageResponse, TokenResponse
from app.schemas.user import UserRead
from app.services.auth import authenticate_user

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = authenticate_user(db, payload.email, payload.password)
    token, expires_at, _ = create_access_token(subject=str(user.id), settings=settings)
    return TokenResponse(
        access_token=token,
        expires_at=expires_at,
        user=UserRead.model_validate(user),
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    current_user=Depends(get_current_user),
) -> MessageResponse:
    _ = current_user
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserRead)
def me(current_user=Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)
