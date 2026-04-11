import { resolveApiBaseUrl } from "@/lib/api-base-url";

type RequestOptions = RequestInit & {
  cacheMode?: RequestCache;
};

function isBearerAuthorizedRequest(options: RequestOptions): boolean {
  const merged = {
    ...(typeof options.headers === "object" &&
    options.headers !== null &&
    !(options.headers instanceof Headers) &&
    !Array.isArray(options.headers)
      ? (options.headers as Record<string, string>)
      : {}),
  };
  const auth = merged.Authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ");
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    ...options,
    cache: options.cacheMode ?? "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      isBearerAuthorizedRequest(options)
    ) {
      try {
        window.localStorage.removeItem("admin_token");
      } catch {
        /* ignore */
      }
      window.location.replace("/admin/login");
    }
    let message = `Request failed: ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {
      // ignore parse errors and keep status-based message
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export type SiteSettingsPayload = {
  site_title: string | null;
  hero_intro: string | null;
  social_links: Array<{ name: string; url: string }>;
};

export type PublicPost = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  cover_url: string | null;
  published_at: string | null;
};

export type PublicAlbum = {
  id: number;
  title: string;
  album_date: string | null;
  description: string | null;
  location: string | null;
  cover_url: string | null;
  photo_count: number;
};

export type PublicPhoto = {
  id: number;
  url: string;
  thumb_url?: string | null;
  preview_url?: string | null;
  description: string | null;
  sort_order: number;
};

export type PublicAlbumDetail = {
  id: number;
  title: string;
  album_date: string | null;
  description: string | null;
  location: string | null;
  photos: PublicPhoto[];
};

export function fetchPublicSiteSettings() {
  return request<SiteSettingsPayload>("/public/site-settings");
}

export function fetchPublicPosts() {
  return request<PublicPost[]>("/public/posts?limit=50");
}

export function fetchPublicAlbums() {
  return request<PublicAlbum[]>("/public/albums?limit=50");
}

export function fetchPublicAlbumDetail(albumId: number) {
  return request<PublicAlbumDetail>(`/public/albums/${albumId}`);
}

export function loginAdmin(username: string, password: string) {
  return request<{ access_token: string; token_type: string; expires_minutes: number }>(
    "/admin/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
  );
}

export function initAdmin(username: string, password: string) {
  return request<{ access_token: string; token_type: string; expires_minutes: number }>(
    "/admin/init",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
  );
}

export function fetchAdminSiteSettings(token: string) {
  return request<SiteSettingsPayload>("/admin/site-settings", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateAdminSiteSettings(token: string, payload: SiteSettingsPayload) {
  return request<SiteSettingsPayload>("/admin/site-settings", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export type AdminPostPayload = {
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  cover_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
};

export type AdminPost = AdminPostPayload & { id: number };

export type AdminAlbumPayload = {
  title: string;
  album_date: string | null;
  description: string | null;
  location: string | null;
  cover_photo_id: number | null;
  sort_order: number;
};

export type AdminAlbum = AdminAlbumPayload & { id: number; photo_count: number };

export type AdminPhotoPayload = {
  qiniu_key: string;
  url: string;
  description: string | null;
  sort_order: number;
};

export type AdminPhoto = AdminPhotoPayload & {
  id: number;
  album_id: number;
  thumb_url?: string | null;
};

function withAuth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function adminListPosts(token: string) {
  return request<AdminPost[]>("/admin/posts", { headers: withAuth(token) });
}
export function adminGetPost(token: string, id: number) {
  return request<AdminPost>(`/admin/posts/${id}`, { headers: withAuth(token) });
}
export function adminCreatePost(token: string, payload: AdminPostPayload) {
  return request<AdminPost>("/admin/posts", {
    method: "POST",
    headers: withAuth(token),
    body: JSON.stringify(payload),
  });
}
export function adminUpdatePost(token: string, id: number, payload: AdminPostPayload) {
  return request<AdminPost>(`/admin/posts/${id}`, {
    method: "PUT",
    headers: withAuth(token),
    body: JSON.stringify(payload),
  });
}
export function adminDeletePost(token: string, id: number) {
  return request<{ ok: boolean }>(`/admin/posts/${id}`, {
    method: "DELETE",
    headers: withAuth(token),
  });
}

export function adminListAlbums(token: string) {
  return request<AdminAlbum[]>("/admin/albums", { headers: withAuth(token) });
}
export function adminCreateAlbum(token: string, payload: AdminAlbumPayload) {
  return request<AdminAlbum>("/admin/albums", {
    method: "POST",
    headers: withAuth(token),
    body: JSON.stringify(payload),
  });
}
export function adminUpdateAlbum(token: string, id: number, payload: AdminAlbumPayload) {
  return request<AdminAlbum>(`/admin/albums/${id}`, {
    method: "PUT",
    headers: withAuth(token),
    body: JSON.stringify(payload),
  });
}
export function adminDeleteAlbum(token: string, id: number) {
  return request<{ ok: boolean }>(`/admin/albums/${id}`, {
    method: "DELETE",
    headers: withAuth(token),
  });
}

export function adminListPhotos(token: string, albumId: number) {
  return request<AdminPhoto[]>(`/admin/albums/${albumId}/photos`, {
    headers: withAuth(token),
  });
}
export function adminAddPhoto(token: string, albumId: number, payload: AdminPhotoPayload) {
  return request<AdminPhoto>(`/admin/albums/${albumId}/photos`, {
    method: "POST",
    headers: withAuth(token),
    body: JSON.stringify(payload),
  });
}
export function adminDeletePhoto(token: string, id: number) {
  return request<{ ok: boolean }>(`/admin/photos/${id}`, {
    method: "DELETE",
    headers: withAuth(token),
  });
}

export type OssTokenPayload = {
  token: string;
  expires_in: number;
  bucket: string;
  upload_prefix: string | null;
  upload_host: string;
  public_base_url: string | null;
};

export function fetchOssToken(token: string, albumId: number) {
  return request<OssTokenPayload>(`/oss/token?album_id=${albumId}`, {
    headers: withAuth(token),
  });
}

export async function uploadFileToQiniu(
  uploadHost: string,
  uploadToken: string,
  file: File,
): Promise<{ key: string }> {
  const form = new FormData();
  form.append("token", uploadToken);
  form.append("file", file);
  const res = await fetch(uploadHost, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`七牛上传失败(${res.status})`);
  }
  const data = (await res.json()) as { key?: string };
  if (!data.key) {
    throw new Error("七牛上传返回缺少 key");
  }
  return { key: data.key };
}
