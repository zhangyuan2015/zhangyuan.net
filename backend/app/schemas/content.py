from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.admin import SocialLink


class PublicSiteSettingsResponse(BaseModel):
    site_title: str | None
    hero_intro: str | None
    social_links: list[SocialLink] = Field(default_factory=list)


class PublicPostItem(BaseModel):
    id: int
    title: str
    slug: str
    summary: str | None
    cover_url: str | None
    published_at: datetime | None


class PublicAlbumItem(BaseModel):
    id: int
    title: str
    album_date: date | None
    description: str | None
    location: str | None
    cover_url: str | None
    photo_count: int


class PublicPhotoItem(BaseModel):
    id: int
    url: str
    thumb_url: str | None = None
    preview_url: str | None = None
    description: str | None
    sort_order: int


class PublicAlbumDetailResponse(BaseModel):
    id: int
    title: str
    album_date: date | None
    description: str | None
    location: str | None
    photos: list[PublicPhotoItem] = Field(default_factory=list)
