import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteShell } from "@/components/site-shell";
import { getServerApiBaseUrl } from "@/lib/api-base-url";
import { siteConfig } from "@/lib/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const apiBaseUrl = getServerApiBaseUrl();
  let siteTitle = siteConfig.name;

  try {
    const response = await fetch(`${apiBaseUrl}/public/site-settings`, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = (await response.json()) as { site_title?: string | null };
      if (data.site_title && data.site_title.trim()) {
        siteTitle = data.site_title.trim();
      }
    }
  } catch {
    // Ignore and fallback to default static title.
  }

  return {
    title: {
      default: siteTitle,
      template: `%s · ${siteTitle}`,
    },
    description: siteConfig.description,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiBaseUrl = getServerApiBaseUrl();
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__APP_API_BASE_URL__=${JSON.stringify(apiBaseUrl)};`,
          }}
        />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
