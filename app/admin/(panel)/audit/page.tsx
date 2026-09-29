import type { Metadata } from "next";
import { Panel, Table, adminStyles as styles } from "@/components/admin/Panel";
import { requireSection } from "@/lib/admin-sections";
import { auditLabel } from "@/lib/audit-labels";
import { prisma } from "@/lib/db";
import { TZ } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Журнал действий" };

const PAGE = 100;

export default async function AuditPage() {
  await requireSection("audit");
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE,
    include: { user: { select: { email: true } } },
  });
  const fmt = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });

  return (
    <>
      <h1>Журнал действий</h1>
      <Panel hint={`Последние ${PAGE} действий в админке. Пароли, телефоны и имена гостей в журнал не попадают.`}>
        {rows.length === 0 ? (
          <p className={styles.hint}>Пока пусто.</p>
        ) : (
          <Table head={["Когда", "Кто", "Что", "Подробности"]} label="Журнал действий">
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{fmt.format(row.createdAt)}</td>
                <td>{row.user?.email ?? "удалённый доступ"}</td>
                <td>{auditLabel(row.action)}</td>
                <td>
                  <code>{row.payload && row.payload.length > 160 ? `${row.payload.slice(0, 160)}…` : row.payload}</code>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
