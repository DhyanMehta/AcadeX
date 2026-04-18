from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.revoked_token import RevokedToken
from app.models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if user is None or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
    return user


def build_login_payload(user: User, settings) -> dict:
    token, expires_at, token_jti = create_access_token(subject=str(user.id), settings=settings)
    return {
        "access_token": token,
        "expires_at": expires_at.isoformat(),
        "jti": token_jti,
        "user": user,
    }


def revoke_token(db: Session, jti: str, expires_at: datetime) -> None:
    revoked_token = db.scalar(select(RevokedToken).where(RevokedToken.jti == jti))
    if revoked_token is None:
        db.add(RevokedToken(jti=jti, expires_at=expires_at.astimezone(timezone.utc)))
        db.commit()


def create_user(db: Session, *, full_name: str, email: str, password: str, role: str = "student") -> User:
    user = User(full_name=full_name, email=email, hashed_password=get_password_hash(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
