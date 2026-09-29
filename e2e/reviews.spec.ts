import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { isModuleEnabled } from "../lib/config";
import { REVIEWS_PATH } from "../modules/reviews/lib/data";
import { login, OWNER } from "./helpers";

const prisma = new PrismaClient();
const enabled = isModuleEnabled("reviews");
const NAME = `Гость отзыва ${Date.now()}`;

test.describe("отзывы", () => {
  test.skip(!enabled, "модуль reviews выключен в client.config.ts");

  test.afterAll(async () => {
    await prisma.review.deleteMany({ where: { authorName: { startsWith: "Гость отзыва" } } });
    await prisma.$disconnect();
  });

  test("отзыв гостя виден только после одобрения", async ({ page }) => {
    await page.context().setExtraHTTPHeaders({ "x-forwarded-for": "10.70.0.1" });
    await page.goto(REVIEWS_PATH);
    await page.getByLabel("Как подписать отзыв").fill(NAME);
    await page.getByLabel("Отзыв", { exact: true }).fill("Всё прошло отлично, рекомендую.");
    await page.getByLabel(/Согласен на публикацию/).check();
    await page.getByRole("button", { name: "Отправить отзыв" }).click();
    await expect(page.getByRole("status")).toContainText("после проверки");

    await page.reload();
    await expect(page.getByText(NAME)).toHaveCount(0);

    await login(page, OWNER, "10.70.0.2");
    await page.goto("/admin/reviews");
    const item = page.locator("details", { hasText: NAME });
    await item.getByLabel("Статус").selectOption("published");
    await item.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect.poll(async () => (await prisma.review.findFirst({ where: { authorName: NAME } }))?.status).toBe("published");

    await page.goto(REVIEWS_PATH);
    await expect(page.getByText(NAME)).toBeVisible();
  });

  test("без согласия автора сервер не публикует отзыв", async ({ page }) => {
    const r = await prisma.review.create({ data: { authorName: `Гость отзыва без согласия ${Date.now()}`, text: "Текст без согласия", source: "admin", status: "pending" } });
    await login(page, OWNER, "10.70.0.3");
    await page.goto("/admin/reviews");
    const item = page.locator("details", { hasText: r.authorName });
    await item.getByLabel("Статус").selectOption("published");
    await item.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(item.getByRole("alert").first()).toContainText("без согласия");
    expect((await prisma.review.findUnique({ where: { id: r.id } }))?.status).toBe("pending");
  });
});
