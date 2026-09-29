// Повторы внешней отправки (уведомления): задержки 1, 5, 15, 60 минут, всего
// не больше 5 попыток. Задачу повторов гоняет cron модуля каждые 5 минут.

export const RETRY_DELAYS_MIN = [1, 5, 15, 60] as const;
export const MAX_ATTEMPTS = 5;

/** Пауза перед следующей попыткой в мс, или null если попытки исчерпаны. Чистая. */
export function retryDelayMs(attempts: number): number | null {
  if (attempts >= MAX_ATTEMPTS) return null;
  const minutes = RETRY_DELAYS_MIN[attempts - 1] ?? RETRY_DELAYS_MIN[RETRY_DELAYS_MIN.length - 1];
  return minutes * 60_000;
}
