const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api/v1";

declare global {
  interface Window {
    __APP_API_BASE_URL__?: string;
  }
}

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/$/, "");
}

/**
 * 服务端（RSC / generateMetadata / Node）使用：读取容器/进程在启动时注入的环境变量。
 * 优先 API_BASE_URL，其次 NEXT_PUBLIC_API_BASE_URL（与 docker run -e 一致）。
 */
export function getServerApiBaseUrl(): string {
  const raw = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!raw?.trim()) return DEFAULT_API_BASE_URL;
  return normalizeBaseUrl(raw);
}

/**
 * 浏览器端：使用根布局注入的 window.__APP_API_BASE_URL__（运行时生效，不依赖构建期内联）。
 */
export function resolveApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return getServerApiBaseUrl();
  }
  const injected = window.__APP_API_BASE_URL__;
  if (injected?.trim()) return normalizeBaseUrl(injected);
  return DEFAULT_API_BASE_URL;
}
