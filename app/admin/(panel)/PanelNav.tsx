"use client";

// Боковое меню админки. На телефоне свёрнуто в кнопку: иначе до любого раздела
// пришлось бы прокручивать мимо всего списка. Клиентский компонент только ради
// состояния «открыто/закрыто» и подсветки текущего раздела.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "@/components/admin/admin.module.css";

type Item = { href: string; title: string };

export function PanelNav({
  brand,
  sections,
  roleTitle,
  email,
  logout,
}: {
  brand: string;
  sections: Item[];
  roleTitle: string;
  email: string;
  logout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isCurrent = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className={`${styles.side} ${open ? styles.sideOpen : ""}`}>
      <div className={styles.topbar}>
        <div className={styles.brand}>
          <Link href="/admin" className={styles.brandLink} onClick={() => setOpen(false)}>
            {brand}
          </Link>
          <p className={styles.role}>{roleTitle}</p>
          <p className={styles.email}>{email}</p>
        </div>
        <button
          type="button"
          className={styles.burger}
          aria-expanded={open}
          aria-controls="panel-menu"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      <div id="panel-menu" className={styles.collapsible}>
        <nav aria-label="Разделы админки">
          <ul className={styles.menu}>
            {sections.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className={styles.menuLink}
                  aria-current={isCurrent(section.href) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {section.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Смена своего пароля доступна любой роли, поэтому живёт рядом с выходом. */}
        <Link href="/admin/password" className={styles.selfLink} onClick={() => setOpen(false)}>
          Сменить пароль
        </Link>

        <form action={logout}>
          <button type="submit" className={styles.logoutButton}>
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}
