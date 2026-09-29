// lib/time.ts
// Часовой пояс клиента из конфига. В контейнере UTC, поэтому считаем явно через
// Intl: разбор локализованной строки и setHours зависят от зоны процесса и дают
// сдвиг. Ошибка тут проявляется только вечером, поэтому тесты обязательны.

import { config } from "./config";

export const TZ = config.timezone;

const WEEKDAY_BY_SHORT: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** Текущий день недели в зоне клиента: 1 понедельник .. 7 воскресенье. */
export function currentWeekdayIndex(now: Date = new Date(), tz: string = TZ): number {
  const short = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(now);
  return WEEKDAY_BY_SHORT[short];
}

/** Дата в зоне клиента в виде «2026-08-10». */
export function localDateKey(now: Date = new Date(), tz: string = TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Время в зоне клиента в виде «19:05». */
export function localClock(now: Date = new Date(), tz: string = TZ): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

/** Смещение зоны от UTC в минутах на данный момент (Москва: 180). */
export function tzOffsetMinutes(now: Date = new Date(), tz: string = TZ): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(now.getTime() / 1000) * 1000) / 60000);
}

/** «2026-08-10» + «19:00» в зоне клиента в момент UTC. */
export function zonedToUtc(dateKey: string, time: string, tz: string = TZ): Date {
  const guess = new Date(`${dateKey}T${time}:00Z`);
  const offset = tzOffsetMinutes(guess, tz);
  const result = new Date(guess.getTime() - offset * 60000);
  // Второй проход на случай перехода часов между guess и результатом.
  const offset2 = tzOffsetMinutes(result, tz);
  return offset2 === offset ? result : new Date(guess.getTime() - offset2 * 60000);
}

/** Начало сегодняшнего дня в зоне клиента, как момент UTC. */
export function startOfLocalDay(now: Date = new Date(), tz: string = TZ): Date {
  return zonedToUtc(localDateKey(now, tz), "00:00", tz);
}

/** Прибавить дни к ключу даты «2026-08-10». */
export function addDaysKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** День недели ключа даты: 1 понедельник .. 7 воскресенье. */
export function weekdayOfKey(dateKey: string): number {
  const day = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}
