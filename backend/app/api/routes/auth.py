from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.security import create_access_token, decode_token
from app.db.session import get_db
from app.schemas.auth import LoginRequest, MessageResponse, TokenResponse
from app.schemas.user import UserRead
from app.services.auth import authenticate_user, revoke_token

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = authenticate_user(db, payload.email, payload.password)
    token, expires_at, _ = create_access_token(subject=str(user.id), settings=settings)
    return TokenResponse(
        access_token=token,
        expires_at=expires_at.isoformat(),
        user=UserRead.model_validate(user),
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    current_user=Depends(get_current_user),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> MessageResponse:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_token(token, settings)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    jti = payload.get("jti")
    exp = payload.get("exp")
    token_type = payload.get("type")
    if token_type != "access" or jti is None or exp is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    revoke_token(db, jti, datetime.fromtimestamp(exp, tz=timezone.utc))
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserRead)
def me(current_user=Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)
