import Link from "next/link";

import {
  fetchPublicAlbumDetail,
  fetchPublicAlbums,
  fetchPublicSiteSettings,
} from "@/lib/api";
import { siteConfig } from "@/lib/site";

export default async function HomePage() {
  let siteTitle = siteConfig.name;
  let heroIntro =
    "这里会放一段关于你自己的感性介绍：走过的路、读过的书、按下快门时的光。";
  let socialLinks: Array<{ name: string; url: string }> = [];
  let latestPhotos: Array<{ id: number; url: string; title: string }> = [];

  try {
    const [settings, albums] = await Promise.all([
      fetchPublicSiteSettings(),
      fetchPublicAlbums(),
    ]);
    siteTitle = settings.site_title || siteTitle;
    heroIntro = settings.hero_intro || heroIntro;
    socialLinks = settings.social_links;
    const latestAlbumDetails = await Promise.all(
      albums.slice(0, 3).map((item) => fetchPublicAlbumDetail(item.id)),
    );
    latestPhotos = latestAlbumDetails
      .flatMap((detail) =>
        detail.photos.map((photo) => ({
          id: photo.id,
          url: photo.thumb_url || photo.url,
          title: detail.title || `相册 ${detail.id}`,
        })),
      )
      .slice(0, 4);
  } catch {
    // 服务不可用时展示静态占位内容，避免首屏白页
    socialLinks = [
      { name: "GitHub", url: "https://github.com" },
      { name: "知乎", url: "https://www.zhihu.com" },
      { name: "抖音", url: "https://www.douyin.com" },
    ];
    latestPhotos = [];
  }

  return (
    <div className="space-y-16">
<section className="space-y-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400">
          hello world
        </p>
        <p className="max-w-xl text-lg leading-relaxed text-slate-400">
          {heroIntro}
        </p>
        <div className="flex flex-wrap gap-3">
          {socialLinks.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm text-slate-300 transition hover:border-blue-500/50 hover:text-blue-400"
            >
              {s.name}
            </a>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-medium text-slate-100">最新动态</h2>
          <Link
            href="/gallery"
            className="text-sm text-blue-400 transition hover:text-blue-300"
          >
            进入相册 →
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {latestPhotos.length > 0
            ? latestPhotos.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/gallery"
                    className="group block aspect-square overflow-hidden rounded-xl bg-slate-800 ring-1 ring-slate-700/60 transition hover:ring-blue-500/40"
                    title={item.title}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.title}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </Link>
                </li>
              ))
            : [1, 2, 3, 4].map((n) => (
                <li key={n}>
                  <Link
                    href="/gallery"
                    className="group block aspect-square overflow-hidden rounded-xl bg-slate-800 ring-1 ring-slate-700/60 transition hover:ring-blue-500/40"
                  >
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-center text-xs text-slate-500 transition group-hover:text-slate-400">
                      相册预览 {n}
                    </div>
                  </Link>
                </li>
              ))}
        </ul>
      </section>
    </div>
  );
}
