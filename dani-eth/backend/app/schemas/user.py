from pydantic import BaseModel, Field

# Roles que un Admin de empresa puede asignar a usuarios operativos
OPERATIONAL_ROLES = {"security_engineer", "pentester", "analyst", "viewer"}

# Todos los roles asignables por endpoints normales (no incluye super_admin)
ALLOWED_ROLES = {"admin"} | OPERATIONAL_ROLES


class UserResponse(BaseModel):
    user_id: str
    name: str | None
    email: str | None
    role: str
    company_id: str | None = None


class RoleUpdate(BaseModel):
    role: str = Field(..., description=f"Opciones: {sorted(ALLOWED_ROLES)}")


class CreateCompanyUserRequest(BaseModel):
    """Body para que el Admin de empresa cree un usuario nuevo en su empresa."""
    email: str
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=255)
    role: str = Field(..., description=f"Opciones: {sorted(OPERATIONAL_ROLES)}")
