import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/admin/admin.module.css";
import { requireSection, sectionHref, sectionsForRole } from "@/lib/admin-sections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Обзор" };

export default async function OverviewPage() {
  const user = await requireSection("");
  const sections = sectionsForRole(user.role).filter((s) => s.slug !== "");

  return (
    <>
      <h1>Обзор</h1>
      <p className={styles.hint}>Разделы админки. Меню слева повторяет этот список.</p>
      <div className={styles.tiles}>
        {sections.map((s) => (
          <Link key={s.slug} href={sectionHref(s.slug)} className={styles.tile}>
            <b>{s.title}</b>
          </Link>
        ))}
      </div>
    </>
  );
}
