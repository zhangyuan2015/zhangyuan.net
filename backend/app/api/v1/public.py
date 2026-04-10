from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.content import (
    PublicAlbumDetailResponse,
    PublicAlbumItem,
    PublicPostItem,
    PublicSiteSettingsResponse,
)
from app.services import content_service

router = APIRouter()


@router.get("/site-settings", response_model=PublicSiteSettingsResponse)
def get_site_settings(db: Session = Depends(get_db)) -> PublicSiteSettingsResponse:
    data = content_service.get_public_site_settings(db)
    return PublicSiteSettingsResponse(**data)


@router.get("/posts", response_model=list[PublicPostItem])
def get_posts(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[PublicPostItem]:
    return [PublicPostItem(**item) for item in content_service.list_public_posts(db, limit=limit)]


@router.get("/albums", response_model=list[PublicAlbumItem])
def get_albums(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[PublicAlbumItem]:
    return [PublicAlbumItem(**item) for item in content_service.list_public_albums(db, limit=limit)]


@router.get("/albums/{album_id}", response_model=PublicAlbumDetailResponse)
def get_album_detail(album_id: int, db: Session = Depends(get_db)) -> PublicAlbumDetailResponse:
    payload = content_service.get_public_album_detail(db, album_id=album_id)
    if not payload:
        raise HTTPException(status_code=404, detail="相册不存在")
    return PublicAlbumDetailResponse(**payload)
