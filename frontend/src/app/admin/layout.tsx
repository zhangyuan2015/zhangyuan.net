"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const menuItems = [
  { href: "/admin/settings", label: "系统设置" },
  { href: "/admin/posts", label: "博客管理" },
  { href: "/admin/albums", label: "相册管理" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="grid min-h-[calc(100vh-120px)] grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
      <aside className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">后台管理</p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
