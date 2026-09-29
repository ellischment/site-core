import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { isModuleEnabled } from "../lib/config";
import { BLOG_PATH } from "../modules/blog/lib/data";
import { login, OWNER } from "./helpers";

const prisma = new PrismaClient();
const enabled = isModuleEnabled("blog");
const STAMP = Date.now();
const TITLE = `E2e статья ${STAMP}`;
const SLUG = `e2e-statya-${STAMP}`;
const NEW_SLUG = `e2e-novyy-adres-${STAMP}`;

test.describe("блог", () => {
  test.skip(!enabled, "модуль blog выключен в client.config.ts");

  test.afterAll(async () => {
    await prisma.article.deleteMany({ where: { slug: { in: [SLUG, NEW_SLUG] } } });
    await prisma.redirect.deleteMany({ where: { from: { contains: `e2e-statya-${STAMP}` } } });
    await prisma.$disconnect();
  });

  test("черновик не виден, опубликованная статья видна, смена адреса ведёт на новый", async ({ page, request }) => {
    await login(page, OWNER, "10.60.0.1");
    await page.goto("/admin/blog");
    const create = page.locator("details", { hasText: "Новая статья" });
    await create.getByLabel("Заголовок", { exact: true }).fill(TITLE);
    await create.getByLabel(/^Текст/).fill("## Раздел\n\nПервый абзац статьи.");
    await create.getByLabel("Адрес").fill(SLUG);
    await create.getByRole("button", { name: "Создать статью" }).click();
    const item = page.locator("details", { hasText: TITLE });
    await expect(item).toContainText("черновик");

    expect((await request.get(`${BLOG_PATH}/${SLUG}`)).status()).toBe(404);

    await item.locator("summary").click();
    await item.getByLabel("Опубликовать на сайте").check();
    await item.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(item).toContainText("опубликована");

    await page.goto(BLOG_PATH);
    await page.getByRole("link", { name: TITLE }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Раздел" })).toBeVisible();

    // Меняем адрес: старая ссылка отвечает постоянным редиректом.
    await page.goto("/admin/blog");
    const again = page.locator("details", { hasText: TITLE });
    await again.locator("summary").click();
    await again.getByLabel("Адрес").fill(NEW_SLUG);
    await again.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect.poll(async () => (await prisma.article.findFirst({ where: { title: TITLE } }))?.slug).toBe(NEW_SLUG);

    const old = await request.get(`${BLOG_PATH}/${SLUG}`, { maxRedirects: 0 });
    expect(old.status()).toBe(308);
    expect(old.headers().location).toContain(`${BLOG_PATH}/${NEW_SLUG}`);
    expect((await request.get(`${BLOG_PATH}/${NEW_SLUG}`)).status()).toBe(200);
  });

  test("страница списка за пределами отвечает 404", async ({ request }) => {
    expect((await request.get(`${BLOG_PATH}?page=999`)).status()).toBe(404);
    expect((await request.get(`${BLOG_PATH}?page=abc`)).status()).toBe(404);
  });
});

test("выключенный блог отвечает 404", async ({ request }) => {
  test.skip(enabled, "модуль blog включён");
  expect((await request.get(BLOG_PATH)).status()).toBe(404);
});
