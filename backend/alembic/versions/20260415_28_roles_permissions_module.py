"""add dedicated roles permissions module

Revision ID: 20260415_28
Revises: 20260414_27
Create Date: 2026-04-15 16:10:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision = "20260415_28"
down_revision = "20260414_27"
branch_labels = None
depends_on = None


ROLE_SEEDS = [
    {
        "role_key": "super_admin",
        "display_name": "Super administrador",
        "scope": "global",
        "description": "Acceso total de plataforma",
    },
    {
        "role_key": "contador",
        "display_name": "Contador",
        "scope": "global",
        "description": "Acceso financiero y conciliación",
    },
    {
        "role_key": "soporte",
        "display_name": "Soporte",
        "scope": "global",
        "description": "Soporte operativo y técnico",
    },
    {
        "role_key": "comercial",
        "display_name": "Comercial",
        "scope": "global",
        "description": "Prospectos y seguimiento comercial",
    },
    {
        "role_key": "operaciones",
        "display_name": "Operaciones",
        "scope": "global",
        "description": "Operación interna de plataforma",
    },
    {
        "role_key": "client_admin",
        "display_name": "Administrador de cliente",
        "scope": "client",
        "description": "Administrador del cliente principal",
    },
    {
        "role_key": "brand_admin",
        "display_name": "Administrador de marca",
        "scope": "brand",
        "description": "Administrador de marca",
    },
    {
        "role_key": "brand_operator",
        "display_name": "Operador de marca",
        "scope": "brand",
        "description": "Operación diaria de marca",
    },
    {
        "role_key": "brand_support_viewer",
        "display_name": "Visor de soporte de marca",
        "scope": "brand",
        "description": "Consulta soporte e incidencias",
    },
]

PERMISSION_SEEDS = [
    {
        "permission_key": "global.view_dashboard",
        "display_name": "Ver dashboard global",
        "domain": "global",
    },
    {
        "permission_key": "global.view_clients",
        "display_name": "Ver clientes",
        "domain": "global",
    },
    {
        "permission_key": "global.view_brands",
        "display_name": "Ver marcas",
        "domain": "global",
    },
    {
        "permission_key": "global.view_payments",
        "display_name": "Ver pagos",
        "domain": "global",
    },
    {
        "permission_key": "global.view_commissions",
        "display_name": "Ver comisiones",
        "domain": "global",
    },
    {
        "permission_key": "global.view_support",
        "display_name": "Ver soporte global",
        "domain": "global",
    },
    {
        "permission_key": "global.view_marketing_prospects",
        "display_name": "Ver prospectos de marketing",
        "domain": "global",
    },
    {
        "permission_key": "global.view_security",
        "display_name": "Ver seguridad",
        "domain": "global",
    },
    {
        "permission_key": "global.manage_internal_users",
        "display_name": "Gestionar usuarios internos",
        "domain": "global",
    },
    {
        "permission_key": "global.manage_roles_permissions",
        "display_name": "Gestionar roles y permisos",
        "domain": "global",
    },
    {
        "permission_key": "brand.view_dashboard",
        "display_name": "Ver dashboard de marca",
        "domain": "brand",
    },
    {
        "permission_key": "brand.manage_catalog",
        "display_name": "Gestionar catálogo",
        "domain": "brand",
    },
    {
        "permission_key": "brand.manage_distributors",
        "display_name": "Gestionar distribuidores",
        "domain": "brand",
    },
    {
        "permission_key": "brand.view_consumption_limits",
        "display_name": "Ver consumo y límites",
        "domain": "brand",
    },
    {
        "permission_key": "brand.open_support",
        "display_name": "Abrir soporte",
        "domain": "brand",
    },
    {
        "permission_key": "brand.buy_addons",
        "display_name": "Comprar add-ons",
        "domain": "brand",
    },
    {
        "permission_key": "brand.edit_branding",
        "display_name": "Editar branding",
        "domain": "brand",
    },
    {
        "permission_key": "brand.view_channels",
        "display_name": "Ver canales",
        "domain": "brand",
    },
    {
        "permission_key": "brand.manage_responses_attention",
        "display_name": "Gestionar respuestas y atención",
        "domain": "brand",
    },
]

ROLE_PERMISSION_MAP: dict[str, Sequence[str]] = {
    "super_admin": [entry["permission_key"] for entry in PERMISSION_SEEDS],
    "contador": [
        "global.view_dashboard",
        "global.view_clients",
        "global.view_brands",
        "global.view_payments",
        "global.view_commissions",
    ],
    "soporte": [
        "global.view_dashboard",
        "global.view_support",
        "brand.view_dashboard",
        "brand.open_support",
        "brand.view_consumption_limits",
    ],
    "comercial": [
        "global.view_dashboard",
        "global.view_clients",
        "global.view_marketing_prospects",
    ],
    "operaciones": [
        "global.view_dashboard",
        "global.view_brands",
        "global.view_support",
        "global.view_security",
    ],
    "client_admin": [
        "brand.view_dashboard",
        "brand.manage_catalog",
        "brand.manage_distributors",
        "brand.view_consumption_limits",
        "brand.open_support",
        "brand.buy_addons",
        "brand.edit_branding",
        "brand.view_channels",
        "brand.manage_responses_attention",
    ],
    "brand_admin": [
        "brand.view_dashboard",
        "brand.manage_catalog",
        "brand.manage_distributors",
        "brand.view_consumption_limits",
        "brand.open_support",
        "brand.buy_addons",
        "brand.edit_branding",
        "brand.view_channels",
        "brand.manage_responses_attention",
    ],
    "brand_operator": [
        "brand.view_dashboard",
        "brand.manage_catalog",
        "brand.manage_distributors",
        "brand.view_consumption_limits",
        "brand.open_support",
        "brand.view_channels",
        "brand.manage_responses_attention",
    ],
    "brand_support_viewer": [
        "brand.view_dashboard",
        "brand.view_consumption_limits",
        "brand.open_support",
        "brand.view_channels",
    ],
}

LEGACY_USER_ROLE_MAP = {
    "reinpia_admin": "super_admin",
    "super_admin": "super_admin",
    "contador": "contador",
    "soporte": "soporte",
    "agency_admin": "operaciones",
    "tenant_admin": "brand_admin",
    "tenant_staff": "brand_operator",
    "distributor_user": "brand_support_viewer",
    "public_customer": None,
}


def _table_exists(bind, table_name: str) -> bool:
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def _index_exists(bind, table_name: str, index_name: str) -> bool:
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    return any(idx["name"] == index_name for idx in inspector.get_indexes(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    if not _table_exists(bind, "users"):
        return

    op.create_table(
        "role_catalog",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role_key", sa.String(length=80), nullable=False),
        sa.Column("display_name", sa.String(length=180), nullable=False),
        sa.Column("scope", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("role_key"),
    )
    op.create_index(op.f("ix_role_catalog_id"), "role_catalog", ["id"], unique=False)
    op.create_index(op.f("ix_role_catalog_role_key"), "role_catalog", ["role_key"], unique=False)
    op.create_index(op.f("ix_role_catalog_scope"), "role_catalog", ["scope"], unique=False)

    op.create_table(
        "permission_catalog",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("permission_key", sa.String(length=120), nullable=False),
        sa.Column("display_name", sa.String(length=220), nullable=False),
        sa.Column("domain", sa.String(length=40), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("permission_key"),
    )
    op.create_index(op.f("ix_permission_catalog_id"), "permission_catalog", ["id"], unique=False)
    op.create_index(op.f("ix_permission_catalog_permission_key"), "permission_catalog", ["permission_key"], unique=False)
    op.create_index(op.f("ix_permission_catalog_domain"), "permission_catalog", ["domain"], unique=False)

    op.create_table(
        "role_permissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["permission_id"], ["permission_catalog.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["role_catalog.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("role_id", "permission_id", name="uq_role_permissions_role_permission"),
    )
    op.create_index(op.f("ix_role_permissions_id"), "role_permissions", ["id"], unique=False)
    op.create_index(op.f("ix_role_permissions_role_id"), "role_permissions", ["role_id"], unique=False)
    op.create_index(op.f("ix_role_permissions_permission_id"), "role_permissions", ["permission_id"], unique=False)

    op.create_table(
        "user_role_assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("scope", sa.String(length=20), nullable=False),
        sa.Column("commercial_client_account_id", sa.Integer(), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["commercial_client_account_id"], ["commercial_client_accounts.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["role_catalog.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "role_id",
            "scope",
            "commercial_client_account_id",
            "tenant_id",
            name="uq_user_role_assignments_scope",
        ),
    )
    op.create_index(op.f("ix_user_role_assignments_id"), "user_role_assignments", ["id"], unique=False)
    op.create_index(op.f("ix_user_role_assignments_user_id"), "user_role_assignments", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_role_assignments_role_id"), "user_role_assignments", ["role_id"], unique=False)
    op.create_index(op.f("ix_user_role_assignments_scope"), "user_role_assignments", ["scope"], unique=False)
    op.create_index(op.f("ix_user_role_assignments_tenant_id"), "user_role_assignments", ["tenant_id"], unique=False)
    op.create_index(
        op.f("ix_user_role_assignments_commercial_client_account_id"),
        "user_role_assignments",
        ["commercial_client_account_id"],
        unique=False,
    )

    role_table = sa.table(
        "role_catalog",
        sa.column("id", sa.Integer()),
        sa.column("role_key", sa.String()),
        sa.column("display_name", sa.String()),
        sa.column("scope", sa.String()),
        sa.column("description", sa.Text()),
        sa.column("is_system", sa.Boolean()),
    )
    permission_table = sa.table(
        "permission_catalog",
        sa.column("id", sa.Integer()),
        sa.column("permission_key", sa.String()),
        sa.column("display_name", sa.String()),
        sa.column("domain", sa.String()),
        sa.column("description", sa.Text()),
    )
    role_permission_table = sa.table(
        "role_permissions",
        sa.column("role_id", sa.Integer()),
        sa.column("permission_id", sa.Integer()),
    )
    user_table = sa.table(
        "users",
        sa.column("id", sa.Integer()),
        sa.column("role", sa.String()),
        sa.column("tenant_id", sa.Integer()),
    )
    assignment_table = sa.table(
        "user_role_assignments",
        sa.column("user_id", sa.Integer()),
        sa.column("role_id", sa.Integer()),
        sa.column("scope", sa.String()),
        sa.column("commercial_client_account_id", sa.Integer()),
        sa.column("tenant_id", sa.Integer()),
        sa.column("is_primary", sa.Boolean()),
        sa.column("is_active", sa.Boolean()),
    )

    op.bulk_insert(role_table, [
        {
            "role_key": item["role_key"],
            "display_name": item["display_name"],
            "scope": item["scope"],
            "description": item["description"],
            "is_system": True,
        }
        for item in ROLE_SEEDS
    ])
    op.bulk_insert(permission_table, [
        {
            "permission_key": item["permission_key"],
            "display_name": item["display_name"],
            "domain": item["domain"],
            "description": item.get("description"),
        }
        for item in PERMISSION_SEEDS
    ])

    role_rows = bind.execute(sa.select(role_table.c.id, role_table.c.role_key)).all()
    permission_rows = bind.execute(sa.select(permission_table.c.id, permission_table.c.permission_key)).all()
    role_by_key = {row.role_key: row.id for row in role_rows}
    permission_by_key = {row.permission_key: row.id for row in permission_rows}

    role_permission_rows: list[dict[str, int]] = []
    for role_key, permission_keys in ROLE_PERMISSION_MAP.items():
        role_id = role_by_key.get(role_key)
        if not role_id:
            continue
        for permission_key in permission_keys:
            permission_id = permission_by_key.get(permission_key)
            if permission_id:
                role_permission_rows.append({"role_id": role_id, "permission_id": permission_id})
    if role_permission_rows:
        op.bulk_insert(role_permission_table, role_permission_rows)

    users = bind.execute(sa.select(user_table.c.id, user_table.c.role, user_table.c.tenant_id)).all()
    assignment_rows: list[dict[str, object]] = []
    for user in users:
        mapped_role_key = LEGACY_USER_ROLE_MAP.get((user.role or "").strip().lower())
        if not mapped_role_key:
            continue
        role_id = role_by_key.get(mapped_role_key)
        if not role_id:
            continue
        if mapped_role_key in {"super_admin", "contador", "soporte", "comercial", "operaciones"}:
            scope = "global"
            tenant_id = None
        elif mapped_role_key == "client_admin":
            scope = "client"
            tenant_id = user.tenant_id
        else:
            scope = "brand"
            tenant_id = user.tenant_id
        assignment_rows.append(
            {
                "user_id": user.id,
                "role_id": role_id,
                "scope": scope,
                "commercial_client_account_id": None,
                "tenant_id": tenant_id,
                "is_primary": True,
                "is_active": True,
            }
        )

    if assignment_rows:
        op.bulk_insert(assignment_table, assignment_rows)


def downgrade() -> None:
    bind = op.get_bind()
    if not _table_exists(bind, "role_catalog"):
        return

    if _index_exists(bind, "user_role_assignments", "ix_user_role_assignments_commercial_client_account_id"):
        op.drop_index(op.f("ix_user_role_assignments_commercial_client_account_id"), table_name="user_role_assignments")
    if _index_exists(bind, "user_role_assignments", "ix_user_role_assignments_tenant_id"):
        op.drop_index(op.f("ix_user_role_assignments_tenant_id"), table_name="user_role_assignments")
    if _index_exists(bind, "user_role_assignments", "ix_user_role_assignments_scope"):
        op.drop_index(op.f("ix_user_role_assignments_scope"), table_name="user_role_assignments")
    if _index_exists(bind, "user_role_assignments", "ix_user_role_assignments_role_id"):
        op.drop_index(op.f("ix_user_role_assignments_role_id"), table_name="user_role_assignments")
    if _index_exists(bind, "user_role_assignments", "ix_user_role_assignments_user_id"):
        op.drop_index(op.f("ix_user_role_assignments_user_id"), table_name="user_role_assignments")
    if _index_exists(bind, "user_role_assignments", "ix_user_role_assignments_id"):
        op.drop_index(op.f("ix_user_role_assignments_id"), table_name="user_role_assignments")
    op.drop_table("user_role_assignments")

    if _index_exists(bind, "role_permissions", "ix_role_permissions_permission_id"):
        op.drop_index(op.f("ix_role_permissions_permission_id"), table_name="role_permissions")
    if _index_exists(bind, "role_permissions", "ix_role_permissions_role_id"):
        op.drop_index(op.f("ix_role_permissions_role_id"), table_name="role_permissions")
    if _index_exists(bind, "role_permissions", "ix_role_permissions_id"):
        op.drop_index(op.f("ix_role_permissions_id"), table_name="role_permissions")
    op.drop_table("role_permissions")

    if _index_exists(bind, "permission_catalog", "ix_permission_catalog_domain"):
        op.drop_index(op.f("ix_permission_catalog_domain"), table_name="permission_catalog")
    if _index_exists(bind, "permission_catalog", "ix_permission_catalog_permission_key"):
        op.drop_index(op.f("ix_permission_catalog_permission_key"), table_name="permission_catalog")
    if _index_exists(bind, "permission_catalog", "ix_permission_catalog_id"):
        op.drop_index(op.f("ix_permission_catalog_id"), table_name="permission_catalog")
    op.drop_table("permission_catalog")

    if _index_exists(bind, "role_catalog", "ix_role_catalog_scope"):
        op.drop_index(op.f("ix_role_catalog_scope"), table_name="role_catalog")
    if _index_exists(bind, "role_catalog", "ix_role_catalog_role_key"):
        op.drop_index(op.f("ix_role_catalog_role_key"), table_name="role_catalog")
    if _index_exists(bind, "role_catalog", "ix_role_catalog_id"):
        op.drop_index(op.f("ix_role_catalog_id"), table_name="role_catalog")
    op.drop_table("role_catalog")
