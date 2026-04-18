from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.user import UserRead


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: str
    user: UserRead


class MessageResponse(BaseModel):
    message: str


class AuthenticatedUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserRead
