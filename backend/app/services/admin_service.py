import json
from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password


@dataclass(frozen=True)
class AdminUser:
    id: int
    username: str


def _get_admin_by_username(db: Session, username: str) -> dict | None:
    row = db.execute(
        text("SELECT id, username, password_hash FROM admins WHERE username = :username LIMIT 1"),
        {"username": username},
    ).mappings().first()
    return dict(row) if row else None


def init_first_admin(db: Session, *, username: str, password: str) -> AdminUser:
    count = db.execute(text("SELECT COUNT(1) FROM admins")).scalar_one()
    if int(count) > 0:
        raise ValueError("管理员已初始化，请直接登录")

    password_hash = hash_password(password)
    db.execute(
        text("INSERT INTO admins(username, password_hash) VALUES(:username, :password_hash)"),
        {"username": username, "password_hash": password_hash},
    )
    db.commit()

    admin = _get_admin_by_username(db, username)
    if not admin:
        raise ValueError("管理员初始化失败")
    return AdminUser(id=int(admin["id"]), username=str(admin["username"]))


def login_admin(db: Session, *, username: str, password: str) -> dict:
    admin = _get_admin_by_username(db, username)
    if not admin or not verify_password(password, str(admin["password_hash"])):
        raise ValueError("用户名或密码错误")

    access_token = create_access_token(subject=str(admin["username"]), admin_id=int(admin["id"]))
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_minutes": settings.jwt_access_token_expire_minutes,
    }


def get_admin_from_token_payload(payload: dict) -> AdminUser:
    admin_id = payload.get("admin_id")
    username = payload.get("sub")
    if not admin_id or not username:
        raise ValueError("token 缺少管理员信息")
    return AdminUser(id=int(admin_id), username=str(username))


def _ensure_site_title_column(db: Session) -> None:
    try:
        db.execute(text("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS site_title VARCHAR(128) NULL"))
        db.commit()
    except Exception:
        db.rollback()


def get_site_settings(db: Session) -> dict:
    _ensure_site_title_column(db)
    row = db.execute(
        text("SELECT site_title, hero_intro, social_links FROM site_settings WHERE id = 1 LIMIT 1")
    ).mappings().first()

    if not row:
        db.execute(
            text("INSERT INTO site_settings(id, site_title, hero_intro, social_links) VALUES(1, NULL, NULL, JSON_ARRAY())")
        )
        db.commit()
        return {"site_title": None, "hero_intro": None, "social_links": []}

    social_links_raw = row.get("social_links")
    if isinstance(social_links_raw, str):
        social_links = json.loads(social_links_raw or "[]")
    else:
        social_links = social_links_raw or []

    return {
        "site_title": row.get("site_title"),
        "hero_intro": row.get("hero_intro"),
        "social_links": social_links,
    }


def update_site_settings(
    db: Session,
    *,
    site_title: str | None,
    hero_intro: str | None,
    social_links: list[dict],
) -> dict:
    _ensure_site_title_column(db)
    social_links_json = json.dumps(social_links, ensure_ascii=False)

    result = db.execute(
        text(
            """
            UPDATE site_settings
            SET site_title = :site_title,
                hero_intro = :hero_intro,
                social_links = :social_links
            WHERE id = 1
            """
        ),
        {"site_title": site_title, "hero_intro": hero_intro, "social_links": social_links_json},
    )
    if result.rowcount == 0:
        db.execute(
            text(
                """
                INSERT INTO site_settings(id, site_title, hero_intro, social_links)
                VALUES(1, :site_title, :hero_intro, :social_links)
                """
            ),
            {"site_title": site_title, "hero_intro": hero_intro, "social_links": social_links_json},
        )
    db.commit()
    return get_site_settings(db)
