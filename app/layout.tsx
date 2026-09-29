import type { Metadata, Viewport } from "next";
import { config } from "@/lib/config";
import { themeCss } from "@/lib/theme";
import { fontClassName } from "@/theme/fonts";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${config.domains.primary}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: config.seo.defaultTitle, template: `%s · ${config.name}` },
  description: config.seo.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Схема, выбранная вручную, ставится до отрисовки: без этого страница мигает
// системной схемой. Скрипт крошечный и инлайновый, CSP это разрешает.
const schemeScript = `try{var s=localStorage.getItem("scheme");if(s==="light"||s==="dark")document.documentElement.dataset.theme=s}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={config.locale.slice(0, 2)} className={fontClassName} suppressHydrationWarning>
      <head>
        <style>{themeCss()}</style>
        <script dangerouslySetInnerHTML={{ __html: schemeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
