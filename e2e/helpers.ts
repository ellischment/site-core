import { expect, type Page } from "@playwright/test";

export const OWNER = { email: process.env.SEED_OWNER_EMAIL!, password: process.env.SEED_OWNER_PASSWORD! };
export const ADMIN = { email: process.env.SEED_ADMIN_EMAIL!, password: process.env.SEED_ADMIN_PASSWORD! };

/**
 * Вход в админку. Каждый тест со своим адресом (x-forwarded-for), чтобы
 * блокировка из теста про подбор пароля не задела соседей.
 */
export async function login(page: Page, who = OWNER, ip = "10.10.0.1"): Promise<void> {
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
  await page.goto("/admin/login");
  await page.getByLabel("Почта").fill(who.email);
  await page.getByLabel("Пароль").fill(who.password);
  await page.getByRole("button", { name: "Войти" }).click();
  // click() не ждёт редирект после серверного действия: без ожидания следующий
  // goto уходит раньше, чем поставится cookie сессии.
  await page.waitForURL((url) => !url.pathname.includes("/admin/login"));
  await expect(page.getByRole("navigation", { name: "Разделы админки" })).toBeVisible();
}
