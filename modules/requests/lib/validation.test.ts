import { describe, expect, it } from "vitest";
import { maskContact, normalizeContact, requestSchema } from "./validation";

const base = { kind: "contact", name: "Мария", channel: "call" as const, contact: "8 (916) 123-45-67", consent: true as const };

describe("контакт по каналу", () => {
  it("телефон приводится к +7", () => {
    expect(normalizeContact("call", "8 (916) 123-45-67")).toBe("+79161234567");
    expect(normalizeContact("call", "9161234567")).toBe("+79161234567");
    expect(normalizeContact("call", "12345")).toBeNull();
  });

  it("Telegram: ник, ссылка или телефон", () => {
    expect(normalizeContact("telegram", "@Some_User")).toBe("@some_user");
    expect(normalizeContact("telegram", "https://t.me/some_user")).toBe("@some_user");
    expect(normalizeContact("telegram", "+7 916 123 45 67")).toBe("+79161234567");
    expect(normalizeContact("telegram", "@ab")).toBeNull();
  });

  it("почта", () => {
    expect(normalizeContact("email", "Name@Example.RU")).toBe("name@example.ru");
    expect(normalizeContact("email", "не почта")).toBeNull();
  });

  it("маска не выдаёт контакт целиком", () => {
    expect(maskContact("+79161234567")).toBe("+7 916 ХХХ 45-67");
    expect(maskContact("@some_user")).toBe("@so***");
    expect(maskContact("name@example.ru")).toBe("na***@example.ru");
  });
});

describe("requestSchema", () => {
  it("принимает заявку и нормализует контакт", () => {
    const r = requestSchema.safeParse(base);
    expect(r.success && r.data.contact).toBe("+79161234567");
  });

  it("без согласия отказ", () => {
    const r = requestSchema.safeParse({ ...base, consent: false });
    expect(r.success).toBe(false);
  });

  it("контакт не под канал: ошибка на поле contact по-русски", () => {
    const r = requestSchema.safeParse({ ...base, channel: "email", contact: "+79161234567" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]).toMatchObject({ path: ["contact"], message: "Проверьте адрес почты" });
  });

  it("заполненная ловушка для ботов: отказ", () => {
    expect(requestSchema.safeParse({ ...base, website: "http://spam" }).success).toBe(false);
  });
});
