from __future__ import annotations
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr

UserRole = Literal["student", "faculty", "coordinator"]


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole
    department_id: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime
