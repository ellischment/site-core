import { NextResponse, type NextRequest } from "next/server";
import { config as clientConfig } from "@/lib/config";
import { decideRoute } from "@/lib/routing";
import { sessionCookieName } from "@/lib/session-cookie";
import { disabledModules } from "@/modules/registry";

// В Next 16 это соглашение называется proxy (прежнее middleware). Правила и
// тесты в lib/routing.ts. Здесь проверяется только наличие cookie: сессия и
// роль проверяются на сервере в каждом разделе и действии.

const SESSION_COOKIE = sessionCookieName();

const routing = {
  adminHost: clientConfig.domains.admin,
  adminOnlyApi: ["/api/store"],
  disabledPaths: disabledModules().flatMap((m) => [...m.publicPaths, ...(m.apiPaths ?? [])]),
};

/** Адрес без страницы: Next отрисует app/not-found.tsx с кодом 404. */
const NOT_FOUND_PATH = "/_not-found-by-proxy";

export function proxy(request: NextRequest) {
  // DEV_HOST подменяет домен локально и в тестах: так проверяются обе ветки.
  const host = process.env.DEV_HOST || request.headers.get("host") || "";
  const decision = decideRoute(
    { host, pathname: request.nextUrl.pathname, hasSession: Boolean(request.cookies.get(SESSION_COOKIE)?.value) },
    routing,
  );

  let response: NextResponse;
  if (decision.kind === "redirect") {
    response = NextResponse.redirect(new URL(decision.to, request.url));
  } else if (decision.kind === "notFound") {
    response = NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
  } else {
    response = NextResponse.next();
  }

  if (decision.noindex) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Статика Next и картинки мимо proxy: им правила доменов не нужны.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
