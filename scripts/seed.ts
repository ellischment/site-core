// Владелец (и при желании администратор) из переменных окружения.
// Повторный запуск не создаёт дублей и не меняет пароль существующего доступа:
// пароль после первого входа меняется в админке.
//
//   SEED_OWNER_EMAIL, SEED_OWNER_PASSWORD   владелец (обязательно)
//   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD   администратор (необязательно)

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// tsx сам .env не читает, а переменные SEED_* живут там. В CI файла нет,
// переменные приходят окружением.
try {
  process.loadEnvFile(".env");
} catch {
  // нет .env
}

const prisma = new PrismaClient();

async function ensureUser(email: string | undefined, password: string | undefined, role: "owner" | "admin") {
  if (!email || !password) return null;
  if (password.length < 10) throw new Error(`Пароль для ${email} короче 10 символов`);
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) return `${normalized}: уже есть, не трогаю`;
  await prisma.user.create({ data: { email: normalized, role, passwordHash: await bcrypt.hash(password, 12) } });
  return `${normalized}: создан (${role})`;
}

async function main() {
  const owner = await ensureUser(process.env.SEED_OWNER_EMAIL, process.env.SEED_OWNER_PASSWORD, "owner");
  if (!owner) throw new Error("Задайте SEED_OWNER_EMAIL и SEED_OWNER_PASSWORD");
  console.log(owner);
  const admin = await ensureUser(process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD, "admin");
  if (admin) console.log(admin);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
