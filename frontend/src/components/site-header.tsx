"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { fetchPublicSiteSettings } from "@/lib/api";
import { navItems, siteConfig } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [siteTitle, setSiteTitle] = useState(siteConfig.name);

  useEffect(() => {
    fetchPublicSiteSettings()
      .then((settings) => {
        if (settings.site_title) {
          setSiteTitle(settings.site_title);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium tracking-tight text-slate-50 transition hover:text-blue-400"
        >
          {siteTitle}
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="主导航">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-2.5 py-1.5 text-sm transition sm:px-3 ${
                  active
                    ? "bg-slate-800 text-slate-50"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
