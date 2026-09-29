// Схема заявки. Одна и та же на клиенте (удобство) и на сервере (безопасность).
// Контакт проверяется по каналу: телефон, ник Telegram или почта.

import { z } from "zod";
import type { RequestChannel } from "@/lib/config-schema";

export const CHANNEL_LABELS: Record<RequestChannel, string> = {
  call: "Звонок",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  max: "MAX",
  sms: "SMS",
  email: "Почта",
};

/** Что просить у гостя под каждый канал. */
export const CONTACT_LABELS: Record<RequestChannel, { label: string; placeholder: string; inputMode: "tel" | "email" | "text" }> = {
  call: { label: "Телефон", placeholder: "+7 900 000-00-00", inputMode: "tel" },
  whatsapp: { label: "Телефон", placeholder: "+7 900 000-00-00", inputMode: "tel" },
  max: { label: "Телефон", placeholder: "+7 900 000-00-00", inputMode: "tel" },
  sms: { label: "Телефон", placeholder: "+7 900 000-00-00", inputMode: "tel" },
  telegram: { label: "Ник в Telegram или телефон", placeholder: "@username", inputMode: "text" },
  email: { label: "Почта", placeholder: "name@example.ru", inputMode: "email" },
};

export function normalizePhone(value: string): string | null {
  const d = value.replace(/\D/g, "");
  if (d.length === 11 && (d.startsWith("7") || d.startsWith("8"))) return `+7${d.slice(1)}`;
  if (d.length === 10 && d.startsWith("9")) return `+7${d}`;
  return null;
}

/** Контакт в каноническом виде или null, если под канал не подходит. */
export function normalizeContact(channel: RequestChannel, raw: string): string | null {
  const value = raw.trim();
  if (channel === "email") {
    return z.string().email().safeParse(value).success ? value.toLowerCase() : null;
  }
  if (channel === "telegram") {
    const nick = value.replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
    if (/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(nick)) return `@${nick.toLowerCase()}`;
    return normalizePhone(value);
  }
  return normalizePhone(value);
}

/** Маска для списков и журнала: полный контакт только в зашифрованном поле. */
export function maskContact(contact: string): string {
  if (contact.startsWith("+7") && contact.length === 12) {
    return `+7 ${contact.slice(2, 5)} ХХХ ${contact.slice(8, 10)}-${contact.slice(10)}`;
  }
  if (contact.startsWith("@")) return `@${contact.slice(1, 3)}***`;
  const [user, domain] = contact.split("@");
  if (domain) return `${user.slice(0, 2)}***@${domain}`;
  return "скрыт";
}

export const requestSchema = z
  .object({
    kind: z.string().min(1, "Неизвестный вид обращения").max(40),
    subject: z.string().trim().max(200, "Слишком длинное название").optional(),
    name: z.string().trim().min(2, "Как к вам обращаться").max(80, "Имя не длиннее 80 знаков"),
    channel: z.enum(["call", "telegram", "whatsapp", "max", "sms", "email"], "Выберите способ связи"),
    contact: z.string().trim().min(1, "Оставьте контакт").max(120, "Слишком длинный контакт"),
    comment: z.string().trim().max(2000, "Сообщение не длиннее 2000 знаков").optional(),
    consent: z.literal(true, "Нужно согласие на обработку данных"),
    source: z.string().max(300).optional(),
    // Ловушка для ботов: поле скрыто от людей, заполненное значит бот.
    website: z.string().max(0, "Похоже на автоматическую отправку").optional(),
  })
  .transform((value, ctx) => {
    const contact = normalizeContact(value.channel, value.contact);
    if (!contact) {
      ctx.addIssue({
        code: "custom",
        path: ["contact"],
        message: value.channel === "email" ? "Проверьте адрес почты" : value.channel === "telegram" ? "Ник от 5 символов или телефон полностью" : "Введите телефон полностью",
      });
      return z.NEVER;
    }
    return { ...value, contact };
  });

export type RequestInput = z.output<typeof requestSchema>;
