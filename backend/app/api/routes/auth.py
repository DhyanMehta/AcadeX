from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import secrets
from datetime import datetime, timedelta, timezone

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.security import create_access_token, verify_password, get_password_hash
from app.db.session import get_db
from app.models import User
from app.schemas.auth import LoginRequest, MessageResponse, TokenResponse
from app.schemas.user import UserRead
from app.services.auth import authenticate_user
from app.services.email_service import send_reset_email

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
        must_change_password=getattr(user, 'must_change_password', False),
    )


@router.post("/logout", response_model=MessageResponse)
def logout(current_user=Depends(get_current_user)) -> MessageResponse:
    _ = current_user
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserRead)
def me(current_user=Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.put("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    current_user.password_hash = get_password_hash(payload.new_password)
    current_user.must_change_password = False
    db.commit()
    return {"message": "Password changed successfully."}


# ── Forgot Password ──────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()
    # Always return success to prevent email enumeration attacks
    if not user:
        return {"message": "If that email is registered, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()

    reset_url = f"{settings.frontend_url}/reset-password?token={token}"
    background_tasks.add_task(send_reset_email, user.email, user.name, reset_url)

    return {"message": "If that email is registered, a reset link has been sent."}


# ── Reset Password ───────────────────────────────────────────────────────

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(payload.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")

    user = db.query(User).filter(User.reset_token == payload.token).first()
    if not user:
        raise HTTPException(400, "Invalid or expired reset link.")
    if user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(400, "Reset link has expired. Please request a new one.")

    user.password_hash = get_password_hash(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.must_change_password = False
    db.commit()
    return {"message": "Password reset successfully. You can now log in."}
