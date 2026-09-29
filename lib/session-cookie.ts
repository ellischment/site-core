// Имя cookie сессии. Отдельный файл без импорта Prisma: его читает proxy.ts,
// а туда серверный клиент базы тянуть незачем.

import { config } from "./config";

export function sessionCookieName(): string {
  return `${config.shortName.replace(/-/g, "_")}_session`;
}
