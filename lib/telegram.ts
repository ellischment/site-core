// Отправка в Telegram: только исходящие сообщения, без кнопок и вебхуков.
// Ошибка отправки не бросается: её разбирает вызывающий (повторы, lib/retry.ts).
//
// Персональные данные в сообщения не кладём: Telegram за границей, а вынос ПДн
// за рубеж это трансграничная передача (ст. 12 152-ФЗ). Контакты гостя
// остаются в базе на сервере, владелец смотрит их в админке.

import { config } from "./config";

const TIMEOUT_MS = 8_000;

/**
 * База Bot API. На сервере в РФ, где api.telegram.org режется, ставится
 * TELEGRAM_API_BASE: адрес релея, который прозрачно проксирует запрос.
 */
function telegramBase(): string {
  return (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/+$/, "");
}

export function isTelegramConfigured(): boolean {
  return config.integrations.telegram.enabled && Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendTelegram(text: string): Promise<SendResult> {
  if (!isTelegramConfigured()) return { ok: false, error: "Telegram не настроен: нет токена бота или id чата" };

  const url = `${telegramBase()}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    const detail = await res.text().catch(() => "");
    return { ok: false, error: `Telegram ответил ${res.status}. ${detail.slice(0, 160)}` };
  } catch (error) {
    return { ok: false, error: `Не удалось отправить: ${String(error).slice(0, 160)}` };
  } finally {
    clearTimeout(timer);
  }
}
