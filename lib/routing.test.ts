import { describe, expect, it } from "vitest";
import { decideRoute, type RoutingConfig } from "./routing";

const split: RoutingConfig = { adminHost: "admin.example.test", adminOnlyApi: ["/api/store"], disabledPaths: [] };
const single: RoutingConfig = { adminOnlyApi: ["/api/store"], disabledPaths: ["/blog"] };

const go = (cfg: RoutingConfig, host: string, pathname: string, hasSession = false) =>
  decideRoute({ host, pathname, hasSession }, cfg);

describe("домен админки", () => {
  it("«/» ведёт в /admin и закрыт от индексации", () => {
    expect(go(split, "admin.example.test", "/")).toEqual({ kind: "redirect", to: "/admin", noindex: true });
  });

  it("публичных страниц нет: 404", () => {
    expect(go(split, "admin.example.test", "/projects").kind).toBe("notFound");
  });

  it("www и порт не мешают узнать домен", () => {
    expect(go(split, "www.admin.example.test:3000", "/").kind).toBe("redirect");
  });

  it("закрытое API и служебные адреса доступны", () => {
    expect(go(split, "admin.example.test", "/api/store", true)).toEqual({ kind: "next", noindex: true });
    expect(go(split, "admin.example.test", "/robots.txt")).toEqual({ kind: "next", noindex: true });
    expect(go(split, "admin.example.test", "/_next/static/x.js").kind).toBe("next");
  });

  it("админка без сессии ведёт на вход с возвратом", () => {
    expect(go(split, "admin.example.test", "/admin/system")).toEqual({
      kind: "redirect",
      to: "/admin/login?next=%2Fadmin%2Fsystem",
      noindex: true,
    });
  });
});

describe("публичный домен при отдельной админке", () => {
  it("/admin и закрытое API отвечают 404 даже с сессией", () => {
    expect(go(split, "example.test", "/admin", true)).toEqual({ kind: "notFound", noindex: false });
    expect(go(split, "example.test", "/admin/login").kind).toBe("notFound");
    expect(go(split, "example.test", "/api/store/records/1", true).kind).toBe("notFound");
  });

  it("публичные страницы открыты и индексируются", () => {
    expect(go(split, "example.test", "/")).toEqual({ kind: "next", noindex: false });
    expect(go(split, "example.test", "/api/storefront").kind).toBe("next");
  });
});

describe("один домен", () => {
  it("админка на том же домене закрыта входом", () => {
    expect(go(single, "example.test", "/admin")).toEqual({ kind: "redirect", to: "/admin/login", noindex: false });
    expect(go(single, "example.test", "/admin/login").kind).toBe("next");
    expect(go(single, "example.test", "/admin", true).kind).toBe("next");
  });

  it("адреса выключенного модуля отвечают 404", () => {
    expect(go(single, "example.test", "/blog").kind).toBe("notFound");
    expect(go(single, "example.test", "/blog/post").kind).toBe("notFound");
    expect(go(single, "example.test", "/blogger").kind).toBe("next");
  });
});
