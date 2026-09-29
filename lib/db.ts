// lib/db.ts
// Клиент Prisma. WAL и busy_timeout включаются один раз при создании.

import { PrismaClient } from "@prisma/client";

/**
 * Одно соединение с SQLite на процесс. PRAGMA busy_timeout действует только на
 * то соединение, где его выполнили, а пул Prisma держит несколько: остальные
 * при всплеске записей падали с «Socket timeout» (30 одновременных заявок,
 * 24 отказа). SQLite всё равно пускает одного писателя за раз, поэтому одно
 * соединение ничего не теряет, а очередь выстраивается внутри процесса.
 * socket_timeout с запасом на эту очередь. Заданные в DATABASE_URL значения
 * не трогаем.
 */
export function withSqliteParams(url: string | undefined): string | undefined {
  if (!url?.startsWith("file:")) return url;
  const [base, query = ""] = url.split("?");
  const params = new URLSearchParams(query);
  if (!params.has("connection_limit")) params.set("connection_limit", "1");
  if (!params.has("socket_timeout")) params.set("socket_timeout", "20");
  return `${base}?${params.toString()}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaReady?: Promise<void>;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: withSqliteParams(process.env.DATABASE_URL),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// WAL: чтение не блокируется записью.
// busy_timeout: параллельная запись ждёт, а не падает с SQLITE_BUSY.
// Оба PRAGMA возвращают строку результата, поэтому вызываются через $queryRawUnsafe:
// $executeRaw в SQLite бросает P2010, если команда что-то вернула.
async function applyPragmas(client: PrismaClient): Promise<void> {
  await client.$queryRawUnsafe("PRAGMA journal_mode = WAL");
  await client.$queryRawUnsafe("PRAGMA busy_timeout = 5000");
}

// Промис сохраняется, а не теряется: иначе сбой настройки базы
// превратится в необработанное отклонение и останется незамеченным.
export const prismaReady: Promise<void> =
  globalForPrisma.prismaReady ?? applyPragmas(prisma);

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaReady = prismaReady;
}
