import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { isModuleEnabled } from "../lib/config";
import { GALLERY_PATH } from "../modules/gallery/lib/data";
import { login, OWNER } from "./helpers";

const prisma = new PrismaClient();
const enabled = isModuleEnabled("gallery");
const TITLE = `E2e работа ${Date.now()}`;

test.describe("галерея", () => {
  test.skip(!enabled, "модуль gallery выключен в client.config.ts");

  test.afterAll(async () => {
    const items = await prisma.galleryItem.findMany({ where: { title: TITLE } });
    await prisma.media.deleteMany({ where: { entity: "galleryItem", entityId: { in: items.map((i) => i.id) } } });
    await prisma.galleryItem.deleteMany({ where: { title: TITLE } });
    await prisma.$disconnect();
  });

  test("работа без фото не видна, с фото появляется на сайте", async ({ page }) => {
    await login(page, OWNER, "10.80.0.1");
    await page.goto("/admin/gallery");
    const create = page.locator("details", { hasText: "Новая работа" });
    await create.getByLabel("Название").fill(TITLE);
    await create.getByRole("button", { name: "Добавить работу" }).click();
    const item = page.locator("details", { hasText: TITLE });
    await expect(item).toBeVisible();

    await page.goto(GALLERY_PATH);
    await expect(page.getByText(TITLE)).toHaveCount(0);

    await page.goto("/admin/gallery");
    const again = page.locator("details", { hasText: TITLE });
    await again.locator("summary").click();
    const photo = await sharp({ create: { width: 1400, height: 1000, channels: 3, background: { r: 200, g: 150, b: 90 } } }).jpeg().toBuffer();
    await again.locator('input[type="file"]').setInputFiles({ name: "work.jpg", mimeType: "image/jpeg", buffer: photo });
    await expect(again.locator("img")).toHaveCount(1, { timeout: 15_000 });

    await page.goto(GALLERY_PATH);
    await expect(page.getByText(TITLE)).toBeVisible();
  });
});
