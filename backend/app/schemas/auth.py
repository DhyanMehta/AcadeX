from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, EmailStr, StringConstraints

from app.schemas.user import UserRead

PasswordValue = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=8, max_length=128),
]


class LoginRequest(BaseModel):
    email: EmailStr
    password: PasswordValue


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_at: datetime
    user: UserRead
    must_change_password: bool = False


class MessageResponse(BaseModel):
    message: str
