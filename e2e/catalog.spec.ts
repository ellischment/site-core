import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { isModuleEnabled } from "../lib/config";
import { CATALOG_PATH } from "../modules/catalog/lib/data";
import { login, OWNER } from "./helpers";

const prisma = new PrismaClient();
const enabled = isModuleEnabled("catalog");
const TITLE = `E2e позиция ${Date.now()}`;
const SLUG = `e2e-poziciya-${Date.now()}`;

/** Фото для загрузки: генерируем, а не храним бинарник в репозитории. */
async function testPhoto(): Promise<Buffer> {
  return sharp({ create: { width: 1200, height: 900, channels: 3, background: { r: 90, g: 120, b: 200 } } }).jpeg().toBuffer();
}

test.describe("каталог", () => {
  test.skip(!enabled, "модуль catalog выключен в client.config.ts");

  test.afterAll(async () => {
    const items = await prisma.catalogItem.findMany({ where: { slug: SLUG } });
    await prisma.media.deleteMany({ where: { entity: "catalogItem", entityId: { in: items.map((i) => i.id) } } });
    await prisma.catalogItem.deleteMany({ where: { slug: SLUG } });
    await prisma.$disconnect();
  });

  test("позиция из админки с фото появляется на сайте, скрытая отвечает 404", async ({ page, request }) => {
    await login(page, OWNER, "10.50.0.1");
    await page.goto("/admin/catalog");
    const create = page.locator("details", { hasText: "Новая позиция" });
    await create.getByLabel("Название").fill(TITLE);
    await create.getByLabel("Цена текстом").fill("от 1 234 ₽");
    await create.getByLabel("Адрес страницы").fill(SLUG);
    await create.getByRole("button", { name: "Добавить позицию" }).click();
    // После сохранения список перерисовывается: новая позиция появляется своей строкой.
    const item = page.locator("details", { hasText: TITLE });
    await expect(item).toBeVisible();
    await item.locator("summary").click();
    await item.locator('input[type="file"]').setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: await testPhoto() });
    await expect(item.locator("img")).toHaveCount(1, { timeout: 15_000 });

    // На сайте: в списке и на своей странице, фото отдаётся.
    await page.goto(CATALOG_PATH);
    await page.getByRole("link", { name: TITLE }).click();
    await expect(page.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();
    await expect(page.getByText("от 1 234 ₽")).toBeVisible();
    const src = await page.locator("main img").first().getAttribute("src");
    expect((await request.get(src!)).status()).toBe(200);

    // Скрыли в админке: страница пропадает сразу (сброс кэша).
    await page.goto("/admin/catalog");
    const again = page.locator("details", { hasText: TITLE });
    await again.locator("summary").click();
    await again.getByLabel("Показывать на сайте").uncheck();
    await again.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(again.getByRole("status").first()).toContainText("Сохранено");
    expect((await request.get(`${CATALOG_PATH}/${SLUG}`)).status()).toBe(404);
  });
});

test("выключенный каталог отвечает 404", async ({ request }) => {
  test.skip(enabled, "модуль catalog включён");
  expect((await request.get(CATALOG_PATH)).status()).toBe(404);
});
