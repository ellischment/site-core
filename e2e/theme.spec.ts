import { expect, test } from "@playwright/test";
import { login, OWNER } from "./helpers";

test("стайлгайд закрыт в проде без входа и открыт после входа", async ({ page, request }) => {
  expect((await request.get("/styleguide")).status()).toBe(404);
  await login(page, OWNER, "10.10.5.1");
  const res = await page.goto("/styleguide");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("region", { name: "Тёмная схема" })).toBeVisible();
});

test("раздел «Внешний вид» показывает токены", async ({ page }) => {
  await login(page, OWNER, "10.10.5.2");
  await page.goto("/admin/appearance");
  await expect(page.getByRole("heading", { level: 1, name: "Внешний вид" })).toBeVisible();
  await expect(page.getByText("Светлая схема")).toBeVisible();
});

test("переключатель схемы запоминает выбор", async ({ page }) => {
  await login(page, OWNER, "10.10.5.3");
  const toggle = page.getByRole("button", { name: /Оформление/ });
  await toggle.click(); // система → светлая
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await toggle.click(); // светлая → тёмная
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const light = await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
    return getComputedStyle(document.body).backgroundColor;
  });
  expect(bg).not.toBe(light);
});
