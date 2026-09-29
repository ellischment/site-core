import { describe, expect, it } from "vitest";
import { addDaysKey, currentWeekdayIndex, localClock, localDateKey, startOfLocalDay, weekdayOfKey, zonedToUtc } from "./time";

const MSK = "Europe/Moscow";

describe("время в зоне клиента", () => {
  it("в 01:00 по Москве дата уже московская, хотя в UTC ещё вчера", () => {
    const now = new Date("2026-08-09T22:00:00Z"); // 01:00 МСК 10 августа
    expect(localDateKey(now, MSK)).toBe("2026-08-10");
    expect(localClock(now, MSK)).toBe("01:00");
    expect(currentWeekdayIndex(now, MSK)).toBe(1); // понедельник
  });

  it("начало дня по Москве это 21:00 UTC предыдущего дня", () => {
    const now = new Date("2026-08-10T12:00:00Z");
    expect(startOfLocalDay(now, MSK).toISOString()).toBe("2026-08-09T21:00:00.000Z");
  });

  it("зона с переходом часов считается по дате, а не по текущему смещению", () => {
    expect(zonedToUtc("2026-01-15", "12:00", "Europe/Berlin").toISOString()).toBe("2026-01-15T11:00:00.000Z");
    expect(zonedToUtc("2026-07-15", "12:00", "Europe/Berlin").toISOString()).toBe("2026-07-15T10:00:00.000Z");
  });

  it("ключи дат: прибавление через конец месяца и день недели", () => {
    expect(addDaysKey("2026-08-31", 1)).toBe("2026-09-01");
    expect(weekdayOfKey("2026-08-10")).toBe(1);
    expect(weekdayOfKey("2026-08-16")).toBe(7);
  });
});
