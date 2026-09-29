import { redirect } from "next/navigation";
import styles from "@/components/admin/admin.module.css";
import { sectionHref, sectionsForRole } from "@/lib/admin-sections";
import { currentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { ROLE_TITLES } from "@/lib/constants";
import { logout } from "./actions";
import { PanelNav } from "./PanelNav";

// Все страницы админки рендерятся динамически, без кэша.
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");

  const sections = sectionsForRole(user.role).map((s) => ({ href: sectionHref(s.slug), title: s.title }));

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#razdel">
        Перейти к разделу
      </a>
      <PanelNav brand={config.name} sections={sections} roleTitle={ROLE_TITLES[user.role]} email={user.email} logout={logout} />
      <main id="razdel" className={styles.content}>
        {children}
      </main>
    </div>
  );
}
