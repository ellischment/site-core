import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { MAX_LOGIN_ATTEMPTS } from "../lib/auth";
import { ADMIN, OWNER, login } from "./helpers";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("вход в админку и выход", async ({ page }) => {
  await login(page, OWNER, "10.10.1.1");
  await expect(page.getByRole("heading", { level: 1, name: "Обзор" })).toBeVisible();
  await page.getByRole("button", { name: "Выйти" }).click();
  await page.waitForURL((url) => url.pathname === "/admin/login");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("без сессии админка ведёт на вход с возвратом", async ({ page }) => {
  await page.goto("/admin/system");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fsystem/);
});

test("пять неудачных попыток блокируют вход с адреса", async ({ page }) => {
  const ip = `10.20.${Date.now() % 250}.${Math.floor(Math.random() * 250)}`;
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
  try {
    await page.goto("/admin/login");
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i += 1) {
      await page.getByLabel("Почта").fill(OWNER.email);
      await page.getByLabel("Пароль").fill(`wrong-password-${i}`);
      await page.getByRole("button", { name: "Войти" }).click();
      await expect(page.locator("form [role=alert]")).toContainText("не подходят");
      // Текст ошибки одинаковый у всех попыток: ждём, пока попытка ляжет в базу.
      await expect.poll(() => prisma.loginAttempt.count({ where: { ip } })).toBe(i + 1);
    }
    // Теперь не пускает даже с верным паролем.
    await page.getByLabel("Пароль").fill(OWNER.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.locator("form [role=alert]")).toContainText("заблокирован");
    await expect(page).toHaveURL(/\/admin\/login/);
  } finally {
    // Тест создал попытки, тест их и убирает.
    await prisma.loginAttempt.deleteMany({ where: { ip } });
  }
});

test("раздел владельца отвечает администратору 403, а не 200", async ({ page }) => {
  await login(page, ADMIN, "10.10.2.1");
  for (const path of ["/admin/settings", "/admin/audit", "/admin/system"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(403);
    await expect(page.getByRole("heading", { name: "Недостаточно прав" })).toBeVisible();
  }
  // В меню администратора разделов владельца нет.
  await page.goto("/admin");
  await expect(page.getByRole("link", { name: "Доступы" })).toHaveCount(0);
});

test("владелец видит свои разделы", async ({ page }) => {
  await login(page, OWNER, "10.10.3.1");
  for (const path of ["/admin/settings", "/admin/audit", "/admin/system"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
  }
});

test("несуществующий адрес отвечает 404", async ({ request }) => {
  const res = await request.get(`/net-takoy-stranitsy-${Date.now()}`);
  expect(res.status()).toBe(404);
  expect(await res.text()).toContain("Такой страницы нет");
});

test("несуществующий раздел админки отвечает 404", async ({ page }) => {
  await login(page, OWNER, "10.10.4.1");
  const res = await page.goto("/admin/net-razdela");
  expect(res?.status()).toBe(404);
});

test("cron без ключа отвечает 401, с ключом выполняет уборку", async ({ request }) => {
  expect((await request.get("/api/cron?task=prune-personal")).status()).toBe(401);
  const ok = await request.get("/api/cron?task=prune-personal", {
    headers: { "x-cron-secret": process.env.CRON_SECRET! },
  });
  expect(ok.status()).toBe(200);
  expect((await ok.json()).task).toBe("prune-personal");
});
