import { Panel, adminStyles as styles } from "@/components/admin/Panel";
import { requireSection } from "@/lib/admin-sections";
import { prisma } from "@/lib/db";
import { startOfLocalDay } from "@/lib/time";
import { BookingList } from "./BookingList";

export default async function BookingsPage({ past }: { past: boolean }) {
  await requireSection("booking");
  const from = startOfLocalDay();
  const rows = await prisma.booking.findMany({
    where: past ? { startsAt: { lt: from } } : { startsAt: { gte: from } },
    include: { service: { select: { title: true } } },
    orderBy: { startsAt: past ? "desc" : "asc" },
    take: 200,
  });
  return (
    <>
      <h1>Запись</h1>
      <p className={styles.hint}>
        {past ? <a href="/admin/booking">Предстоящие</a> : <a href="/admin/booking?past=1">Прошедшие</a>}. Услуги, часы работы и выходные: раздел «Услуги и часы».
      </p>
      <Panel title={past ? "Прошедшие записи" : "Предстоящие записи"}>
        <BookingList rows={rows} empty="Записей нет." />
      </Panel>
    </>
  );
}
