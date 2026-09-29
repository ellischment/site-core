// Чтение данных записи из базы и конфига.

import { config } from "@/lib/config";
import { prisma } from "@/lib/db";
import { TZ } from "@/lib/time";
import { bookableDates, computeSlots, weekdayOfKey } from "./slots";

export function bookingSettings() {
  return config.modules.booking ?? { slotMinutes: 30, horizonDays: 30, leadMinutes: 120, keepDays: 180 };
}

export function locations() {
  return config.contacts.locations;
}

export function locationTitle(id: string): string {
  return locations().find((l) => l.id === id)?.title ?? id;
}

export function parseLocationIds(json: string): string[] {
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Точки, где оказывают услугу: пустой список в базе значит «во всех». */
export function serviceLocations(locationIdsJson: string): string[] {
  const ids = parseLocationIds(locationIdsJson);
  const all = locations().map((l) => l.id);
  return ids.length === 0 ? all : ids.filter((id) => all.includes(id));
}

export async function visibleServices() {
  return prisma.bookingService.findMany({ where: { visible: true }, orderBy: [{ sort: "asc" }, { title: "asc" }] });
}

/** Свободное время на дату. Та же функция проверяет время при создании записи. */
export async function slotsFor(serviceId: string, locationId: string, dateKey: string, now: Date = new Date()): Promise<string[]> {
  const settings = bookingSettings();
  if (!bookableDates(now, settings.horizonDays, TZ).includes(dateKey)) return [];

  const service = await prisma.bookingService.findUnique({ where: { id: serviceId } });
  if (!service || !service.visible || !serviceLocations(service.locationIds).includes(locationId)) return [];

  // Занятость берём с запасом на сутки в обе стороны: дата в зоне клиента, база в UTC.
  const dayStart = new Date(`${dateKey}T00:00:00Z`).getTime();
  const [hours, dayOffs, busy] = await Promise.all([
    prisma.workingHours.findUnique({ where: { locationId_weekday: { locationId, weekday: weekdayOfKey(dateKey) } } }),
    prisma.dayOff.count({ where: { date: dateKey, OR: [{ locationId: null }, { locationId }] } }),
    prisma.booking.findMany({
      where: {
        locationId,
        status: { not: "cancelled" },
        startsAt: { lt: new Date(dayStart + 2 * 86_400_000) },
        endsAt: { gt: new Date(dayStart - 86_400_000) },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  return computeSlots({
    dateKey,
    hours: hours ?? undefined,
    isDayOff: dayOffs > 0,
    durationMin: service.durationMin,
    stepMin: settings.slotMinutes,
    busy: busy.map((b) => ({ start: b.startsAt, end: b.endsAt })),
    now,
    leadMinutes: settings.leadMinutes,
    tz: TZ,
  });
}
