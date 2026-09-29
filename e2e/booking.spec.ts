import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { isModuleEnabled } from "../lib/config";
import { addDaysKey, localDateKey } from "../lib/time";
import { login, OWNER } from "./helpers";

const prisma = new PrismaClient();
const enabled = isModuleEnabled("booking");
const MARK = `e2e-услуга-${Date.now()}`;
let serviceId = "";
// Послезавтра: не упираемся в запас до начала и не зависим от часа прогона.
const date = addDaysKey(localDateKey(), 2);

test.describe("запись", () => {
  test.skip(!enabled, "модуль booking выключен в client.config.ts");

  test.beforeAll(async () => {
    const service = await prisma.bookingService.create({
      data: { title: MARK, slug: MARK.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "x", durationMin: 60, priceText: "1 000 ₽", locationIds: JSON.stringify(["main"]) },
    });
    serviceId = service.id;
    for (let weekday = 1; weekday <= 7; weekday += 1) {
      await prisma.workingHours.upsert({
        where: { locationId_weekday: { locationId: "main", weekday } },
        create: { locationId: "main", weekday, opensAt: "10:00", closesAt: "14:00", dayOff: false },
        update: { opensAt: "10:00", closesAt: "14:00", dayOff: false },
      });
    }
  });

  test.afterAll(async () => {
    // Тест создал услугу, часы и записи, тест их и убирает.
    await prisma.booking.deleteMany({ where: { serviceId } });
    await prisma.bookingService.deleteMany({ where: { id: serviceId } });
    await prisma.workingHours.deleteMany({ where: { locationId: "main" } });
    await prisma.$disconnect();
  });

  test("гость записывается на свободное время, владелец видит запись", async ({ page }) => {
    await page.context().setExtraHTTPHeaders({ "x-forwarded-for": "10.40.0.1" });
    await page.goto("/booking");
    await page.getByLabel(new RegExp(MARK)).check();
    const day = page.getByRole("button", { name: new RegExp(`^\\S+, ${Number(date.slice(8))} `) });
    await day.click();
    await page.getByRole("button", { name: "11:00", exact: true }).click();
    await page.getByLabel("Имя").fill("Гость записи");
    await page.getByLabel(/Телефон/).fill(`+7916${String(Date.now()).slice(-7)}`);
    await page.getByLabel(/Согласен на обработку/).check();
    await page.getByRole("button", { name: "Записаться на 11:00" }).click();
    await expect(page.getByRole("status")).toContainText("Вы записаны");

    // Занятое время больше не предлагается.
    const res = await page.request.get(`/api/booking?service=${serviceId}&location=main&date=${date}`);
    const { slots } = await res.json();
    expect(slots).not.toContain("11:00");
    expect(slots).not.toContain("10:30");
    expect(slots).toContain("12:00");

    await login(page, OWNER, "10.40.0.2");
    await page.goto("/admin/booking");
    await expect(page.locator("li", { hasText: MARK }).first()).toContainText("Гость записи");
  });

  test("десять одновременных записей на одно время: успешна одна", async ({ request }) => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        request.post("/api/booking", {
          data: { serviceId, locationId: "main", date, time: "13:00", name: `Гонка ${i}`, channel: "call", contact: `+7916000${String(i).padStart(4, "0")}`, consent: true },
          headers: { "x-forwarded-for": `10.41.${i}.1` },
        }),
      ),
    );
    const statuses = results.map((r) => r.status());
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409).length).toBeGreaterThanOrEqual(8);
  });

  test("время вне часов работы сервер не принимает", async ({ request }) => {
    const res = await request.post("/api/booking", {
      data: { serviceId, locationId: "main", date, time: "19:00", name: "Поздно", channel: "call", contact: "+79160009999", consent: true },
      headers: { "x-forwarded-for": "10.42.0.1" },
    });
    expect(res.status()).toBe(409);
  });
});

test("выключенный модуль записи отвечает 404", async ({ request }) => {
  test.skip(enabled, "модуль booking включён");
  expect((await request.get("/booking")).status()).toBe(404);
});
