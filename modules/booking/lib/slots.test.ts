import { describe, expect, it } from "vitest";
import { zonedToUtc } from "@/lib/time";
import { bookableDates, computeSlots, type SlotInput } from "./slots";

const TZ = "Europe/Moscow";
const base: SlotInput = {
  dateKey: "2026-10-05",
  hours: { opensAt: "10:00", closesAt: "13:00", dayOff: false },
  isDayOff: false,
  durationMin: 60,
  stepMin: 30,
  busy: [],
  now: new Date("2026-10-01T09:00:00Z"),
  leadMinutes: 120,
  tz: TZ,
};

describe("computeSlots", () => {
  it("услуга помещается до закрытия с шагом сетки", () => {
    expect(computeSlots(base)).toEqual(["10:00", "10:30", "11:00", "11:30", "12:00"]);
  });

  it("выходной день недели и отдельный выходной дают пусто", () => {
    expect(computeSlots({ ...base, hours: { ...base.hours!, dayOff: true } })).toEqual([]);
    expect(computeSlots({ ...base, isDayOff: true })).toEqual([]);
    expect(computeSlots({ ...base, hours: undefined })).toEqual([]);
  });

  it("занятое время и его пересечения исключены", () => {
    const busy = [{ start: zonedToUtc("2026-10-05", "11:00", TZ), end: zonedToUtc("2026-10-05", "12:00", TZ) }];
    // 10:30–11:30 и 11:30–12:30 задевают занятое, 10:00–11:00 и 12:00–13:00 нет.
    expect(computeSlots({ ...base, busy })).toEqual(["10:00", "12:00"]);
  });

  it("не раньше чем за leadMinutes до начала, по часам клиента, а не сервера", () => {
    // Сейчас 09:30 МСК 5 октября, запас 2 часа: первое время 11:30.
    const now = new Date("2026-10-05T06:30:00Z");
    expect(computeSlots({ ...base, now })).toEqual(["11:30", "12:00"]);
  });
});

describe("bookableDates", () => {
  it("с сегодняшней даты клиента, даже если в UTC ещё вчера", () => {
    const now = new Date("2026-09-30T22:30:00Z"); // 01:30 МСК 1 октября
    expect(bookableDates(now, 3, TZ)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);
  });
});
