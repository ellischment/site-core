// lib/privacy-prune.ts
// Уборка персональных данных ядра, которые пережили свою пользу.
//
// Попытки входа в панель нужны на час (столько держится блокировка, lib/auth.ts),
// а раздел «Система» показывает последние попытки, по ним владелец замечает
// подбор пароля. Поэтому месяц, дальше это персональные данные без цели (152-ФЗ).
// Модули добавляют свою уборку задачами cron в modules/<id>/module.ts.
//
// Зовётся планировщиком: /api/cron?task=prune-personal, строка crontab в DEPLOY.md.

import { prisma } from "./db";

export const LOGIN_ATTEMPT_KEEP_DAYS = 30;

/** Граница «старее этого убрать». Чистая, поэтому проверяется тестом. */
export function loginAttemptsCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - LOGIN_ATTEMPT_KEEP_DAYS * 24 * 60 * 60_000);
}

export async function pruneCorePersonalData(now: Date = new Date()): Promise<{ attemptsDeleted: number }> {
  const deleted = await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: loginAttemptsCutoff(now) } },
  });
  // Истёкшие сессии: строка сессии не ПДн, но мёртвые строки копятся бесконечно.
  await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
  return { attemptsDeleted: deleted.count };
}
