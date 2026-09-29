// Свободное время для записи. Чистые функции: вход часы работы, занятые
// интервалы и «сейчас», выход список времени начала. Покрыто тестами, потому
// что ошибка здесь это двойная запись или пустое расписание вечером.

import { addDaysKey, localDateKey, weekdayOfKey, zonedToUtc } from "@/lib/time";

export type DayHours = { opensAt: string; closesAt: string; dayOff: boolean };
export type Interval = { start: Date; end: Date };

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export type SlotInput = {
  dateKey: string;
  hours: DayHours | undefined;
  isDayOff: boolean;
  durationMin: number;
  stepMin: number;
  busy: Interval[];
  now: Date;
  leadMinutes: number;
  tz: string;
};

export function computeSlots(input: SlotInput): string[] {
  const { hours } = input;
  if (!hours || hours.dayOff || input.isDayOff) return [];
  const open = toMinutes(hours.opensAt);
  const close = toMinutes(hours.closesAt);
  const earliest = input.now.getTime() + input.leadMinutes * 60_000;
  const out: string[] = [];
  for (let t = open; t + input.durationMin <= close; t += input.stepMin) {
    const time = fromMinutes(t);
    const start = zonedToUtc(input.dateKey, time, input.tz);
    if (start.getTime() < earliest) continue;
    const slot = { start, end: new Date(start.getTime() + input.durationMin * 60_000) };
    if (input.busy.some((b) => overlaps(slot, b))) continue;
    out.push(time);
  }
  return out;
}

/** Даты, на которые открыта запись: с сегодня на horizonDays вперёд. */
export function bookableDates(now: Date, horizonDays: number, tz: string): string[] {
  const today = localDateKey(now, tz);
  return Array.from({ length: horizonDays }, (_, i) => addDaysKey(today, i));
}

export { weekdayOfKey };
