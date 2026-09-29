import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "@playwright/test";

// Раннер Playwright отдельный процесс, .env туда сам не попадает. Читаем тот же
// файл, если он есть. В CI его нет, переменные приходят через env workflow.
try {
  const envFile = readFileSync(path.join(__dirname, ".env"), "utf8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // .env нет, например в CI
}

// Браузер: в облачной среде Chromium уже стоит в /opt/pw-browsers, скачивать
// его не нужно. PW_CHROMIUM задаёт путь явно, иначе Playwright ищет свой.
const executablePath = process.env.PW_CHROMIUM || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);

const PORT = Number(process.env.E2E_PORT || 3100);

// Сервер standalone меняет рабочую папку на .next/standalone, и относительный
// путь к SQLite из .env указывает в пустоту. Даём ему абсолютный путь к той же
// базе, с которой работают prisma migrate и seed (prisma/schema + относительный путь).
function absoluteDbUrl(url: string | undefined): string | undefined {
  if (!url?.startsWith("file:.")) return url;
  return `file:${path.resolve(__dirname, "prisma", "schema", url.slice("file:".length))}`;
}
const DATABASE_URL = absoluteDbUrl(process.env.DATABASE_URL);
// Тестам с прямым доступом к базе (очистка за собой) нужен тот же путь.
if (DATABASE_URL) process.env.DATABASE_URL = DATABASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : {},
  },
  // Сервер на боевой сборке, той же командой, что в контейнере: next start с
  // output:standalone не поддерживается и ломает раздачу файлов.
  webServer: {
    command: "node .next/standalone/server.js",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    // Интеграции в e2e отключены: тест не должен слать уведомления в боевой чат.
    env: {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_CHAT_ID: "",
    },
  },
});
