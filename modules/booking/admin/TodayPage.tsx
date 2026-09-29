import Link from "next/link";
import { Panel, adminStyles as styles } from "@/components/admin/Panel";
import { requireSection } from "@/lib/admin-sections";
import { prisma } from "@/lib/db";
import { addDaysKey, localDateKey, TZ, zonedToUtc } from "@/lib/time";
import { locations } from "../lib/data";
import { BookingList } from "./BookingList";

/** «Сегодня»: записи на сегодня и завтра по точкам. */
export default async function TodayPage() {
  await requireSection("today");
  const today = localDateKey();
  const from = zonedToUtc(today, "00:00", TZ);
  const to = zonedToUtc(addDaysKey(today, 2), "00:00", TZ);
  const rows = await prisma.booking.findMany({
    where: { startsAt: { gte: from, lt: to }, status: { not: "cancelled" } },
    include: { service: { select: { title: true } } },
    orderBy: { startsAt: "asc" },
  });
  const tomorrowStart = zonedToUtc(addDaysKey(today, 1), "00:00", TZ);

  return (
    <>
      <h1>Сегодня</h1>
      <p className={styles.hint}>
        Записи на сегодня и завтра. Все записи и отмена в разделе <Link href="/admin/booking">«Запись»</Link>.
      </p>
      {locations().map((loc) => (
        <Panel key={loc.id} title={loc.title}>
          <h3>Сегодня</h3>
          <BookingList rows={rows.filter((r) => r.locationId === loc.id && r.startsAt < tomorrowStart)} empty="Записей нет." />
          <h3>Завтра</h3>
          <BookingList rows={rows.filter((r) => r.locationId === loc.id && r.startsAt >= tomorrowStart)} empty="Записей нет." />
        </Panel>
      ))}
    </>
  );
}
