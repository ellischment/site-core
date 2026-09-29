import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { RATE_MAX } from "../modules/requests/lib/pipeline";
import { login, OWNER } from "./helpers";

const prisma = new PrismaClient();
const created: string[] = [];

test.afterAll(async () => {
  // Тест создал заявки, тест их и удаляет: по отметке в комментарии.
  await prisma.request.deleteMany({ where: { comment: { startsWith: "e2e-" } } });
  await prisma.$disconnect();
});

function uniquePhone(): string {
  return `+7916${String(Date.now()).slice(-7)}`;
}

test("заявка из формы на сайте попадает в админку, статус меняется, заявка удаляется", async ({ page }) => {
  const marker = `e2e-форма-${Date.now()}`;
  const name = `Гость ${Date.now()}`;
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": "10.30.0.1" });
  await page.goto("/");
  await page.getByLabel("Имя").fill(name);
  await page.getByLabel(/Телефон/).fill(uniquePhone());
  await page.getByLabel("Сообщение").fill(marker);
  await page.getByRole("button", { name: "Отправить" }).click();
  await expect(page.getByText("Нужно согласие")).toBeVisible();
  await page.getByLabel(/Согласен на обработку/).check();
  await page.getByRole("button", { name: "Отправить" }).click();
  await expect(page.getByRole("status")).toContainText("Заявка отправлена");

  const row = await prisma.request.findFirst({ where: { comment: marker } });
  expect(row).not.toBeNull();
  // Имя и контакт в базе зашифрованы.
  expect(row!.nameEnc).not.toContain("Гость");
  expect(row!.contactEnc).not.toContain("916");
  created.push(row!.id);

  await login(page, OWNER, "10.30.0.2");
  await page.goto("/admin/requests");
  const card = page.locator("li", { hasText: marker });
  await expect(card).toContainText(name);
  await card.getByLabel("Статус заявки").selectOption("work");
  await card.getByRole("button", { name: "Сменить статус" }).click();
  await expect(card.getByRole("status")).toContainText("Статус изменён");
  await expect.poll(async () => (await prisma.request.findUnique({ where: { id: row!.id } }))?.status).toBe("work");

  await card.getByRole("button", { name: "Удалить" }).click();
  await expect.poll(() => prisma.request.count({ where: { id: row!.id } })).toBe(0);
});

test("повторная отправка той же заявки не создаёт дубль", async ({ request }) => {
  const phone = uniquePhone();
  const data = { kind: "contact", name: "Дубль", channel: "call", contact: phone, consent: true, comment: `e2e-дубль-${Date.now()}` };
  const headers = { "x-forwarded-for": "10.30.1.1" };
  const first = await (await request.post("/api/requests", { data, headers })).json();
  const second = await (await request.post("/api/requests", { data, headers })).json();
  expect(first.duplicate).toBe(false);
  expect(second).toMatchObject({ duplicate: true, id: first.id });
});

test("сервер отклоняет заявку без согласия и с чужим контактом", async ({ request }) => {
  const headers = { "x-forwarded-for": "10.30.2.1" };
  const noConsent = await request.post("/api/requests", { data: { kind: "contact", name: "Без", channel: "call", contact: uniquePhone(), consent: false }, headers });
  expect(noConsent.status()).toBe(400);
  const badContact = await request.post("/api/requests", { data: { kind: "contact", name: "Почта", channel: "email", contact: "нет", consent: true }, headers });
  expect(badContact.status()).toBe(400);
  expect((await badContact.json()).fields.contact).toBe("Проверьте адрес почты");
});

test(`с одного адреса не больше ${RATE_MAX} заявок за раз`, async ({ request }) => {
  const headers = { "x-forwarded-for": `10.30.3.${Date.now() % 250}` };
  const statuses: number[] = [];
  for (let i = 0; i <= RATE_MAX; i += 1) {
    const res = await request.post("/api/requests", {
      data: { kind: "contact", name: "Частый", channel: "call", contact: uniquePhone().slice(0, -2) + String(10 + i), consent: true, comment: `e2e-частота-${i}` },
      headers,
    });
    statuses.push(res.status());
  }
  expect(statuses.slice(0, RATE_MAX).every((s) => s === 200)).toBe(true);
  expect(statuses[RATE_MAX]).toBe(429);
});

test("30 одновременных одинаковых заявок дают одну запись", async ({ request }) => {
  const phone = uniquePhone();
  const marker = `e2e-гонка-${Date.now()}`;
  const results = await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      request.post("/api/requests", {
        data: { kind: "contact", name: "Гонка", channel: "call", contact: phone, consent: true, comment: marker },
        headers: { "x-forwarded-for": `10.31.${i}.1` },
      }),
    ),
  );
  expect(results.every((r) => r.status() === 200 || r.status() === 503)).toBe(true);
  expect(await prisma.request.count({ where: { comment: marker } })).toBe(1);
});
