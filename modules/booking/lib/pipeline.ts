// Создание записи. Свободность времени проверяется в той же транзакции, что и
// запись: иначе два гостя, нажавшие одновременно, займут один слот.

import { maskContact } from "@/lib/contact";
import { encrypt, fingerprint } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { MAX_ATTEMPTS, retryDelayMs } from "@/lib/retry";
import { isTelegramConfigured, sendTelegram } from "@/lib/telegram";
import { TZ, zonedToUtc } from "@/lib/time";
import { locationTitle, slotsFor } from "./data";
import type { BookingInput } from "./validation";

export const RATE_MAX = 5;
export const RATE_MINUTES = 10;
const TX_OPTIONS = { maxWait: 8_000, timeout: 10_000 } as const;

export type BookingResult =
  | { kind: "limited" }
  | { kind: "busy" }
  | { kind: "taken" }
  | { kind: "saved"; id: string };

function isBusyError(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code;
  if (code === "P2028" || code === "P2024") return true;
  return /SQLITE_BUSY|database is locked|Socket timeout/i.test(String(error));
}

export async function createBooking(input: BookingInput, consentVersion: string, ip?: string, now: Date = new Date()): Promise<BookingResult> {
  // Время должно быть среди свободных по часам, выходным и запасу до начала.
  const free = await slotsFor(input.serviceId, input.locationId, input.date, now);
  if (!free.includes(input.time)) return { kind: "taken" };

  const service = await prisma.bookingService.findUniqueOrThrow({ where: { id: input.serviceId } });
  const startsAt = zonedToUtc(input.date, input.time, TZ);
  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);
  const nameEnc = encrypt(input.name);
  const contactEnc = encrypt(input.contact);

  const attempt = () =>
    prisma.$transaction(async (tx) => {
      if (ip) {
        const since = new Date(now.getTime() - RATE_MINUTES * 60_000);
        if ((await tx.booking.count({ where: { ip, createdAt: { gte: since } } })) >= RATE_MAX) return { limited: true as const };
      }
      // Решающая проверка: под локом записи. Пересечение с любой не отменённой записью в точке.
      const clash = await tx.booking.findFirst({
        where: { locationId: input.locationId, status: { not: "cancelled" }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
        select: { id: true },
      });
      if (clash) return { taken: true as const };
      const row = await tx.booking.create({
        data: {
          serviceId: service.id,
          locationId: input.locationId,
          startsAt,
          endsAt,
          nameEnc,
          contactEnc,
          contactMask: maskContact(input.contact),
          contactHash: fingerprint(input.contact),
          channel: input.channel,
          comment: input.comment || null,
          consentVersion,
          consentAt: now,
          ip: ip ?? null,
          notifyStatus: isTelegramConfigured() ? "pending" : "off",
        },
      });
      return { id: row.id };
    }, TX_OPTIONS);

  let outcome: Awaited<ReturnType<typeof attempt>>;
  try {
    outcome = await attempt();
  } catch (error) {
    if (isBusyError(error)) return { kind: "busy" };
    throw error;
  }
  if ("limited" in outcome) return { kind: "limited" };
  if ("taken" in outcome) return { kind: "taken" };

  void notifyBooking(outcome.id).catch((e) => console.error("Уведомление о записи не отправлено:", e));
  return { kind: "saved", id: outcome.id };
}

/** Текст без персональных данных: услуга, место, время. */
export function bookingNotifyText(b: { serviceTitle: string; locationId: string; startsAt: Date }): string {
  const when = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, day: "numeric", month: "long", weekday: "short", hour: "2-digit", minute: "2-digit" }).format(b.startsAt);
  return [`Новая запись: ${b.serviceTitle}`, `Когда: ${when}`, `Где: ${locationTitle(b.locationId)}`, "Контакты в админке, раздел «Запись»."].join("\n");
}

export async function notifyBooking(id: string, now: Date = new Date()): Promise<boolean> {
  const row = await prisma.booking.findUnique({ where: { id }, include: { service: true } });
  if (!row || row.notifyStatus === "sent" || row.notifyStatus === "off") return false;
  const result = await sendTelegram(bookingNotifyText({ serviceTitle: row.service.title, locationId: row.locationId, startsAt: row.startsAt }));
  if (result.ok) {
    await prisma.booking.update({ where: { id }, data: { notifyStatus: "sent", attempts: { increment: 1 }, nextTryAt: null, lastError: null } });
    return true;
  }
  const delay = retryDelayMs(row.attempts + 1);
  await prisma.booking.update({
    where: { id },
    data: { notifyStatus: "failed", attempts: { increment: 1 }, lastError: result.error.slice(0, 500), nextTryAt: delay === null ? null : new Date(now.getTime() + delay) },
  });
  return false;
}

export async function retryBookingNotifications(now: Date = new Date()): Promise<{ processed: number; sent: number }> {
  if (!isTelegramConfigured()) return { processed: 0, sent: 0 };
  const due = await prisma.booking.findMany({ where: { notifyStatus: "failed", attempts: { lt: MAX_ATTEMPTS }, nextTryAt: { lte: now } }, take: 20 });
  let sent = 0;
  for (const b of due) {
    const lease = await prisma.booking.updateMany({ where: { id: b.id, notifyStatus: "failed", nextTryAt: b.nextTryAt }, data: { nextTryAt: new Date(now.getTime() + 10 * 60_000) } });
    if (lease.count === 0) continue;
    if (await notifyBooking(b.id, now)) sent += 1;
  }
  return { processed: due.length, sent };
}
