import type { NextConfig } from "next";

// Заголовки безопасности ставятся здесь, а не в proxy.ts: headers() покрывает
// все маршруты, включая статику и картинки.
const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy. Источники подобраны под реальные зависимости:
// - 'unsafe-inline' в script-src: Next в App Router кладёт инлайновые скрипты
//   гидратации, а часть страниц статические (SSG), nonce на них не работает.
//   Осознанный размен: securityheaders.com даёт A и с 'unsafe-inline'.
// - mc.yandex.ru: Яндекс Метрика, грузится только после согласия на cookie.
// - frame-src: встроенные плееры видео (lib/video.ts). Видео на сервере не
//   хранится, только ссылки на VK Видео, Rutube, YouTube.
// - style-src 'unsafe-inline': Next и next/font вставляют инлайновые стили,
//   тема клиента приходит инлайновым <style> (lib/theme.ts).
// - в dev добавляются 'unsafe-eval' и ws:, их требует HMR, в бою их нет.
const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "https://mc.yandex.ru", ...(isDev ? ["'unsafe-eval'"] : [])],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https://mc.yandex.ru"],
  "font-src": ["'self'", "data:"],
  "connect-src": ["'self'", "https://mc.yandex.ru", ...(isDev ? ["ws:"] : [])],
  "frame-src": ["'self'", "https://www.youtube.com", "https://rutube.ru", "https://vk.com", "https://vkvideo.ru", "https://mc.yandex.ru"],
  "media-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
};

const csp = Object.entries(cspDirectives)
  .map(([key, values]) => `${key} ${values.join(" ")}`)
  .concat(isDev ? [] : ["upgrade-insecure-requests"])
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // 2 года, поддомены. Без preload: это отдельное обязательство, подаётся вручную.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Дублирует frame-ancestors 'none' для старых проверок.
  { key: "X-Frame-Options", value: "DENY" },
  // Возможности браузера, которыми сайт не пользуется.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

// Тестовый домен закрывается от индексации целиком. robots.txt запрещает всё
// (app/robots.ts), а заголовок закрывает ещё и отдельные ответы (картинки, файлы).
if (process.env.NEXT_PUBLIC_NOINDEX === "1") {
  securityHeaders.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });
}

const nextConfig: NextConfig = {
  // Без standalone в образ пришлось бы класть весь node_modules.
  output: "standalone",
  // X-Powered-By: лишняя подсказка о стеке для того, кто ищет известные дыры.
  poweredByHeader: false,
  // Разделы админки, закрытые по роли, отдают 403 через forbidden(). Без флага
  // Next не разрешает вызов и страница отвечает 200 с текстом отказа.
  experimental: { authInterrupts: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
