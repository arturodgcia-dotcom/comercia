from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Banner
from app.schemas.banner import BannerCreate, BannerRead, BannerUpdate

router = APIRouter()


@router.get("/by-tenant/{tenant_id}", response_model=list[BannerRead])
def list_banners(tenant_id: int, db: Session = Depends(get_db)) -> list[Banner]:
    return db.scalars(
        select(Banner).where(Banner.tenant_id == tenant_id).order_by(Banner.position.asc(), Banner.priority.asc())
    ).all()


@router.post("", response_model=BannerRead, status_code=status.HTTP_201_CREATED)
def create_banner(payload: BannerCreate, db: Session = Depends(get_db)) -> Banner:
    banner = Banner(**payload.model_dump())
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return banner


@router.put("/{banner_id}", response_model=BannerRead)
def update_banner(banner_id: int, payload: BannerUpdate, db: Session = Depends(get_db)) -> Banner:
    banner = db.get(Banner, banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="banner no encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(banner, key, value)
    db.commit()
    db.refresh(banner)
    return banner
