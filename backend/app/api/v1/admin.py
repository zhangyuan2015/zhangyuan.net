from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db import get_db
from app.schemas.admin import (
    AdminInitRequest,
    AdminLoginRequest,
    SiteSettingsResponse,
    SiteSettingsUpdateRequest,
    TokenResponse,
)
from app.schemas.admin_content import (
    AdminAlbumResponse,
    AdminAlbumUpsertRequest,
    AdminPhotoCreateRequest,
    AdminPhotoResponse,
    AdminPostResponse,
    AdminPostUpsertRequest,
)
from app.services import admin_service
from app.services import admin_content_service as content_service
from app.services.admin_service import AdminUser

router = APIRouter()


@router.post("/init", response_model=TokenResponse)
def init_admin(payload: AdminInitRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        admin = admin_service.init_first_admin(
            db,
            username=payload.username,
            password=payload.password,
        )
        token = admin_service.login_admin(db, username=admin.username, password=payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return TokenResponse(**token)


@router.post("/login", response_model=TokenResponse)
def login(payload: AdminLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        token = admin_service.login_admin(db, username=payload.username, password=payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    return TokenResponse(**token)


@router.get("/site-settings", response_model=SiteSettingsResponse)
def get_site_settings(
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> SiteSettingsResponse:
    data = admin_service.get_site_settings(db)
    return SiteSettingsResponse(**data)


@router.put("/site-settings", response_model=SiteSettingsResponse)
def put_site_settings(
    payload: SiteSettingsUpdateRequest,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> SiteSettingsResponse:
    data = admin_service.update_site_settings(
        db,
        site_title=payload.site_title,
        hero_intro=payload.hero_intro,
        social_links=[item.model_dump() for item in payload.social_links],
    )
    return SiteSettingsResponse(**data)


@router.get("/posts", response_model=list[AdminPostResponse])
def admin_list_posts(
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminPostResponse]:
    return [AdminPostResponse(**item) for item in content_service.list_posts(db)]


@router.get("/posts/{post_id}", response_model=AdminPostResponse)
def admin_get_post(
    post_id: int,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminPostResponse:
    item = content_service.get_post(db, post_id)
    if not item:
        raise HTTPException(status_code=404, detail="文章不存在")
    return AdminPostResponse(**item)


@router.post("/posts", response_model=AdminPostResponse)
def admin_create_post(
    payload: AdminPostUpsertRequest,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminPostResponse:
    try:
        item = content_service.create_post(db, payload.model_dump())
        return AdminPostResponse(**item)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"创建文章失败: {exc}") from exc


@router.put("/posts/{post_id}", response_model=AdminPostResponse)
def admin_update_post(
    post_id: int,
    payload: AdminPostUpsertRequest,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminPostResponse:
    try:
        item = content_service.update_post(db, post_id, payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"更新文章失败: {exc}") from exc
    if not item:
        raise HTTPException(status_code=404, detail="文章不存在")
    return AdminPostResponse(**item)


@router.delete("/posts/{post_id}")
def admin_delete_post(
    post_id: int,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    return {"ok": content_service.delete_post(db, post_id)}


@router.get("/albums", response_model=list[AdminAlbumResponse])
def admin_list_albums(
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminAlbumResponse]:
    return [AdminAlbumResponse(**item) for item in content_service.list_albums(db)]


@router.post("/albums", response_model=AdminAlbumResponse)
def admin_create_album(
    payload: AdminAlbumUpsertRequest,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminAlbumResponse:
    item = content_service.create_album(db, payload.model_dump())
    return AdminAlbumResponse(**item)


@router.put("/albums/{album_id}", response_model=AdminAlbumResponse)
def admin_update_album(
    album_id: int,
    payload: AdminAlbumUpsertRequest,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminAlbumResponse:
    item = content_service.update_album(db, album_id, payload.model_dump())
    if not item:
        raise HTTPException(status_code=404, detail="相册不存在")
    return AdminAlbumResponse(**item)


@router.delete("/albums/{album_id}")
def admin_delete_album(
    album_id: int,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    return {"ok": content_service.delete_album(db, album_id)}


@router.get("/albums/{album_id}/photos", response_model=list[AdminPhotoResponse])
def admin_list_photos(
    album_id: int,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminPhotoResponse]:
    return [AdminPhotoResponse(**item) for item in content_service.list_photos(db, album_id)]


@router.post("/albums/{album_id}/photos", response_model=AdminPhotoResponse)
def admin_add_photo(
    album_id: int,
    payload: AdminPhotoCreateRequest,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminPhotoResponse:
    item = content_service.add_photo(db, album_id, payload.model_dump())
    return AdminPhotoResponse(**item)


@router.delete("/photos/{photo_id}")
def admin_delete_photo(
    photo_id: int,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    return {"ok": content_service.delete_photo(db, photo_id)}
