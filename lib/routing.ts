// Решение proxy.ts для запроса. Чистая функция: вход хост, путь, есть ли cookie
// сессии; выход что сделать. Покрыта тестами (lib/routing.test.ts), proxy.ts
// только переводит решение в ответ Next.
//
// Правила:
// 1. Если в конфиге задан отдельный домен админки (domains.admin):
//    - на нём нет публичных страниц: «/» ведёт в /admin, прочее отвечает 404;
//      весь ответ закрыт от индексации заголовком X-Robots-Tag;
//    - на публичном домене /admin и закрытые API отвечают 404.
// 2. /admin без cookie сессии ведёт на вход. Сама сессия и роль проверяются
//    дальше на сервере в каждом разделе и действии.
// 3. Адреса выключенных модулей отвечают 404.

export type RouteInput = {
  host: string;
  pathname: string;
  hasSession: boolean;
};

export type RoutingConfig = {
  adminHost?: string;
  /** Префиксы API, доступные только с домена админки. */
  adminOnlyApi: readonly string[];
  /** Префиксы адресов выключенных модулей. */
  disabledPaths: readonly string[];
};

export type RouteDecision =
  | { kind: "next"; noindex: boolean }
  | { kind: "redirect"; to: string; noindex: boolean }
  | { kind: "notFound"; noindex: boolean };

/** Служебные адреса, которые нужны на любом домене: статика, файлы, cron. */
const ALWAYS_ALLOWED = ["/_next/", "/uploads/", "/api/cron", "/robots.txt", "/favicon.ico", "/icon", "/apple-icon"];

function startsWithAny(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
}

export function decideRoute(input: RouteInput, cfg: RoutingConfig): RouteDecision {
  const { pathname } = input;
  const host = normalizeHost(input.host);
  const adminHost = cfg.adminHost ? normalizeHost(cfg.adminHost) : undefined;
  const onAdminHost = adminHost !== undefined && host === adminHost;
  const noindex = onAdminHost;

  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (adminHost !== undefined) {
    if (onAdminHost) {
      if (pathname === "/") return { kind: "redirect", to: "/admin", noindex };
      const allowed = isAdmin || startsWithAny(pathname, cfg.adminOnlyApi) || ALWAYS_ALLOWED.some((p) => pathname.startsWith(p));
      if (!allowed) return { kind: "notFound", noindex };
    } else if (isAdmin || startsWithAny(pathname, cfg.adminOnlyApi)) {
      return { kind: "notFound", noindex };
    }
  }

  if (startsWithAny(pathname, cfg.disabledPaths)) return { kind: "notFound", noindex };

  if (isAdmin && pathname !== "/admin/login" && !input.hasSession) {
    const to = pathname === "/admin" ? "/admin/login" : `/admin/login?next=${encodeURIComponent(pathname)}`;
    return { kind: "redirect", to, noindex };
  }

  return { kind: "next", noindex };
}
