from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="COMERCIA API", alias="APP_NAME")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    database_url: str = Field(default="sqlite:///./comercia.db", alias="DATABASE_URL")
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
            "http://127.0.0.1:5176",
        ],
        alias="CORS_ORIGINS",
    )
    jwt_secret_key: str = Field(default="change-this-in-production", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=120, alias="JWT_EXPIRE_MINUTES")
    default_currency: str = Field(default="mxn", alias="DEFAULT_CURRENCY")
    data_mode: str = Field(default="demo", alias="DATA_MODE")
    force_superadmin_auth: bool = Field(default=False, alias="FORCE_SUPERADMIN_AUTH")
    force_superadmin_email: str = Field(default="superadmin@comercia.demo", alias="FORCE_SUPERADMIN_EMAIL")
    stripe_price_basic_fixed: str = Field(default="", alias="STRIPE_PRICE_BASIC_FIXED")
    stripe_price_growth_fixed: str = Field(default="", alias="STRIPE_PRICE_GROWTH_FIXED")
    stripe_price_premium_fixed: str = Field(default="", alias="STRIPE_PRICE_PREMIUM_FIXED")
    stripe_price_basic_commission: str = Field(default="", alias="STRIPE_PRICE_BASIC_COMMISSION")
    stripe_price_growth_commission: str = Field(default="", alias="STRIPE_PRICE_GROWTH_COMMISSION")
    stripe_price_premium_commission: str = Field(default="", alias="STRIPE_PRICE_PREMIUM_COMMISSION")
    stripe_price_addon_extra_user: str = Field(default="", alias="STRIPE_PRICE_ADDON_EXTRA_USER")
    stripe_price_addon_extra_ai_agent: str = Field(default="", alias="STRIPE_PRICE_ADDON_EXTRA_AI_AGENT")
    stripe_price_addon_extra_brand: str = Field(default="", alias="STRIPE_PRICE_ADDON_EXTRA_BRAND")
    stripe_price_addon_extra_100_products: str = Field(default="", alias="STRIPE_PRICE_ADDON_EXTRA_100_PRODUCTS")
    stripe_price_addon_extra_branch: str = Field(default="", alias="STRIPE_PRICE_ADDON_EXTRA_BRANCH")
    stripe_price_addon_extra_500_ai_credits: str = Field(default="", alias="STRIPE_PRICE_ADDON_EXTRA_500_AI_CREDITS")
    stripe_price_addon_premium_support: str = Field(default="", alias="STRIPE_PRICE_ADDON_PREMIUM_SUPPORT")
    stripe_price_addon_comercia_connector: str = Field(default="", alias="STRIPE_PRICE_ADDON_COMERCIA_CONNECTOR")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
