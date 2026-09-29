// Проверка окружения при старте сервера: без ключа шифрования заявки не
// сохранятся, без ключа cron не пойдёт уборка персональных данных.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== "phase-production-build") {
    const { checkEnv } = await import("./lib/env");
    checkEnv();
  }
}
