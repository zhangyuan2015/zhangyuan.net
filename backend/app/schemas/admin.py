from pydantic import BaseModel, Field


class AdminInitRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)


class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_minutes: int


class SocialLink(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    url: str = Field(min_length=1, max_length=1024)


class SiteSettingsUpdateRequest(BaseModel):
    site_title: str | None = Field(default=None, max_length=128)
    hero_intro: str | None = None
    social_links: list[SocialLink] = Field(default_factory=list)


class SiteSettingsResponse(BaseModel):
    site_title: str | None
    hero_intro: str | None
    social_links: list[SocialLink]
