// Проверка переменных окружения. Лучше упасть сразу с понятным сообщением,
// чем через неделю на боевом сервере. Вызывается из instrumentation.ts при старте.

import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY короче 32 символов"),
  CRON_SECRET: z.string().min(16, "CRON_SECRET короче 16 символов"),
  NEXT_PUBLIC_SITE_URL: z.string().url(),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  TELEGRAM_API_BASE: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

export function checkEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const list = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Ошибка в переменных окружения:\n${list}`);
  }
  return parsed.data;
}
