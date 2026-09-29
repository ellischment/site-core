// Уборка ПДн записи: IP через час, запись целиком через keepDays после её даты.

import { prisma } from "@/lib/db";
import { bookingSettings } from "./data";

export async function pruneBookings(now: Date = new Date()): Promise<{ ipCleared: number; deleted: number }> {
  const keepDays = bookingSettings().keepDays;
  const cleared = await prisma.booking.updateMany({ where: { ip: { not: null }, createdAt: { lt: new Date(now.getTime() - 60 * 60_000) } }, data: { ip: null } });
  const deleted = await prisma.booking.deleteMany({ where: { endsAt: { lt: new Date(now.getTime() - keepDays * 86_400_000) } } });
  return { ipCleared: cleared.count, deleted: deleted.count };
}
