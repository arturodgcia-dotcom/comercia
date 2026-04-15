from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class RolePermissionRead(BaseModel):
    permission_key: str
    display_name: str
    domain: str


class RoleCatalogRead(TimestampSchema):
    id: int
    role_key: str
    display_name: str
    scope: str
    description: str | None
    is_system: bool
    permissions: list[RolePermissionRead] = []


class PermissionCatalogRead(TimestampSchema):
    id: int
    permission_key: str
    display_name: str
    domain: str
    description: str | None


class UserRoleAssignmentRead(TimestampSchema):
    id: int
    user_id: int
    user_email: str
    user_full_name: str
    role_id: int
    role_key: str
    role_display_name: str
    scope: str
    commercial_client_account_id: int | None
    tenant_id: int | None
    is_primary: bool
    is_active: bool


class UserRoleAssignmentCreate(BaseModel):
    user_id: int
    role_key: str
    scope: str
    commercial_client_account_id: int | None = None
    tenant_id: int | None = None
    is_primary: bool = True
    is_active: bool = True
