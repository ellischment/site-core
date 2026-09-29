// Конвейер заявки. Главное правило: гость получает подтверждение независимо
// от внешних систем. Порядок: частота → дубль → шифрование → запись в базу →
// ответ гостю → уведомление в фоне.

import type { Prisma } from "@prisma/client";
import { encrypt, fingerprint } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { MAX_ATTEMPTS, retryDelayMs } from "@/lib/retry";
import { isTelegramConfigured, sendTelegram } from "@/lib/telegram";
import { config } from "@/lib/config";
import { buildNotifyText } from "./notify";
import { maskContact } from "@/lib/contact";
import type { RequestInput } from "./validation";

/** Повторная отправка той же заявки (двойной клик, «назад») в течение этого окна: дубль. */
export const DEDUP_MINUTES = 10;
/** Частота: не более RATE_MAX заявок с одного адреса за RATE_MINUTES минут. */
export const RATE_MAX = 5;
export const RATE_MINUTES = 10;

export type ProcessResult =
  | { kind: "limited" }
  | { kind: "busy" }
  | { kind: "unknownKind" }
  | { kind: "saved"; id: string; duplicate: boolean };

/**
 * SQLite пускает одного писателя за раз: при всплеске заявки встают в очередь.
 * Значение по умолчанию (2 с) на всплеске кончалось ошибкой P2028 и 500 гостю.
 */
const TX_OPTIONS = { maxWait: 8_000, timeout: 10_000 } as const;

function isBusyError(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code;
  if (code === "P2028" || code === "P2024") return true;
  return /SQLITE_BUSY|database is locked|Socket timeout/i.test(String(error));
}

function findDuplicate(kind: string, contactHash: string, client: Prisma.TransactionClient | typeof prisma = prisma) {
  const since = new Date(Date.now() - DEDUP_MINUTES * 60_000);
  return client.request.findFirst({ where: { kind, contactHash, createdAt: { gte: since } } });
}

export function knownKind(kind: string): boolean {
  return Boolean(config.modules.requests?.kinds.some((k) => k.id === kind));
}

export async function processRequest(input: RequestInput, consentVersion: string, ip?: string): Promise<ProcessResult> {
  if (!knownKind(input.kind)) return { kind: "unknownKind" };

  const contactHash = fingerprint(input.contact);

  // Быстрый путь для двойного клика вне транзакции: транзакция Prisma в SQLite
  // сразу берёт лок на запись, и десять одинаковых заявок зря стояли бы в очереди.
  const dup = await findDuplicate(input.kind, contactHash);
  if (dup) return { kind: "saved", id: dup.id, duplicate: true };

  // Шифрование до транзакции: под открытой транзакцией держится лок записи.
  const nameEnc = encrypt(input.name);
  const contactEnc = encrypt(input.contact);

  // Частота, дубли и запись одной транзакцией. Порознь это гонки «прочитал,
  // проверил, записал»: одновременные заявки проскакивают все проверки разом.
  // Prisma открывает транзакцию SQLite как BEGIN IMMEDIATE, писатели идут по одному.
  const attempt = () =>
    prisma.$transaction(async (tx) => {
      if (ip) {
        const since = new Date(Date.now() - RATE_MINUTES * 60_000);
        const recent = await tx.request.count({ where: { ip, createdAt: { gte: since } } });
        if (recent >= RATE_MAX) return { limited: true as const };
      }
      const inTx = await findDuplicate(input.kind, contactHash, tx);
      if (inTx) return { duplicate: true as const, id: inTx.id };

      const row = await tx.request.create({
        data: {
          kind: input.kind,
          subject: input.subject || null,
          nameEnc,
          contactEnc,
          contactMask: maskContact(input.contact),
          contactHash,
          channel: input.channel,
          comment: input.comment || null,
          consentVersion,
          consentAt: new Date(),
          ip: ip ?? null,
          source: input.source || null,
          notifyStatus: isTelegramConfigured() ? "pending" : "off",
        },
      });
      return { duplicate: false as const, id: row.id };
    }, TX_OPTIONS);

  let outcome: Awaited<ReturnType<typeof attempt>>;
  try {
    outcome = await attempt();
  } catch (error) {
    if (isBusyError(error)) {
      console.warn("Заявка не записана: база занята, гостю предложен повтор.", error);
      return { kind: "busy" };
    }
    throw error;
  }

  if ("limited" in outcome) return { kind: "limited" };
  if (outcome.duplicate) return { kind: "saved", id: outcome.id, duplicate: true };

  // Уведомление в фоне: его судьба не влияет на ответ гостю.
  void notifyRequest(outcome.id).catch((e) => console.error("Уведомление о заявке не отправлено:", outcome.id, e));

  return { kind: "saved", id: outcome.id, duplicate: false };
}

/** Отправка уведомления по заявке. Неудача переводит заявку в повторы (lib/retry.ts). */
export async function notifyRequest(id: string, now: Date = new Date()): Promise<boolean> {
  const row = await prisma.request.findUnique({ where: { id } });
  if (!row || row.notifyStatus === "sent" || row.notifyStatus === "off") return false;

  const result = await sendTelegram(buildNotifyText(row));
  if (result.ok) {
    await prisma.request.update({
      where: { id },
      data: { notifyStatus: "sent", attempts: { increment: 1 }, nextTryAt: null, lastError: null },
    });
    return true;
  }
  const delay = retryDelayMs(row.attempts + 1);
  await prisma.request.update({
    where: { id },
    data: {
      notifyStatus: "failed",
      attempts: { increment: 1 },
      lastError: result.error.slice(0, 500),
      // Попытки исчерпаны: заявка цела в базе и видна в админке, дальше вручную.
      nextTryAt: delay === null ? null : new Date(now.getTime() + delay),
    },
  });
  return false;
}

/** Задача cron: повторить уведомления, у которых подошло время. */
export async function retryNotifications(now: Date = new Date()): Promise<{ processed: number; sent: number }> {
  if (!isTelegramConfigured()) return { processed: 0, sent: 0 };
  const due = await prisma.request.findMany({
    where: { notifyStatus: "failed", attempts: { lt: MAX_ATTEMPTS }, nextTryAt: { lte: now } },
    take: 20,
  });
  let sent = 0;
  for (const r of due) {
    // Аренда строки: пересекающийся запуск cron не отправит ту же заявку дважды.
    const lease = await prisma.request.updateMany({
      where: { id: r.id, notifyStatus: "failed", nextTryAt: r.nextTryAt },
      data: { nextTryAt: new Date(now.getTime() + 10 * 60_000) },
    });
    if (lease.count === 0) continue;
    if (await notifyRequest(r.id, now)) sent += 1;
  }
  return { processed: due.length, sent };
}
