from datetime import date, datetime

from pydantic import BaseModel, Field


class AdminPostUpsertRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    summary: str | None = Field(default=None, max_length=512)
    content: str = Field(min_length=1)
    cover_url: str | None = Field(default=None, max_length=1024)
    status: str = Field(default="draft", pattern="^(draft|published)$")
    published_at: datetime | None = None


class AdminPostResponse(AdminPostUpsertRequest):
    id: int


class AdminAlbumUpsertRequest(BaseModel):
    title: str = Field(default="", max_length=255)
    album_date: date | None = None
    description: str | None = None
    location: str | None = Field(default=None, max_length=255)
    cover_photo_id: int | None = None
    sort_order: int = 0


class AdminAlbumResponse(AdminAlbumUpsertRequest):
    id: int
    photo_count: int = 0


class AdminPhotoCreateRequest(BaseModel):
    qiniu_key: str = Field(min_length=1, max_length=512)
    url: str = Field(min_length=1, max_length=1024)
    description: str | None = Field(default=None, max_length=512)
    sort_order: int = 0


class AdminPhotoResponse(AdminPhotoCreateRequest):
    id: int
    album_id: int
    thumb_url: str | None = None
