// Уборка персональных данных заявок (152-ФЗ: не дольше цели).
// - IP нужен ограничению частоты (RATE_MINUTES), держим час с запасом.
// - Заявка целиком живёт keepDays из конфига (по умолчанию 180), потом удаляется.

import { config } from "@/lib/config";
import { prisma } from "@/lib/db";

export const REQUEST_IP_KEEP_MINUTES = 60;

export function requestCutoffs(now: Date, keepDays: number): { ipBefore: Date; deleteBefore: Date } {
  return {
    ipBefore: new Date(now.getTime() - REQUEST_IP_KEEP_MINUTES * 60_000),
    deleteBefore: new Date(now.getTime() - keepDays * 24 * 60 * 60_000),
  };
}

export async function pruneRequests(now: Date = new Date()): Promise<{ ipCleared: number; deleted: number }> {
  const keepDays = config.modules.requests?.keepDays ?? 180;
  const { ipBefore, deleteBefore } = requestCutoffs(now, keepDays);
  const cleared = await prisma.request.updateMany({ where: { ip: { not: null }, createdAt: { lt: ipBefore } }, data: { ip: null } });
  const deleted = await prisma.request.deleteMany({ where: { createdAt: { lt: deleteBefore } } });
  return { ipCleared: cleared.count, deleted: deleted.count };
}
