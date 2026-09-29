// Реестр разделов админки. Меню строится отсюда, а не списком в вёрстке:
// разделы ядра здесь, разделы модулей в modules/<id>/module.ts.
// Проверка роли на сервере: requireSection в каждой странице раздела.

import { forbidden, notFound, redirect } from "next/navigation";
import { currentUser, type SessionUser } from "./auth";
import { ALL_ROLES, OWNER_ROLES, type UserRole } from "./constants";
import { enabledModules } from "@/modules/registry";

export type AdminSection = {
  slug: string;
  title: string;
  roles: readonly UserRole[];
  /** Порядок в меню: меньше выше. Ядро 0..9 и 90..99, модули 10..89. */
  order: number;
  /** Модуль, которому принадлежит раздел. Нет: раздел ядра. */
  module?: string;
};

export const CORE_SECTIONS: readonly AdminSection[] = [
  { slug: "", title: "Обзор", roles: ALL_ROLES, order: 0 },
  { slug: "appearance", title: "Внешний вид", roles: ALL_ROLES, order: 85 },
  { slug: "settings", title: "Доступы", roles: OWNER_ROLES, order: 90 },
  { slug: "audit", title: "Журнал действий", roles: OWNER_ROLES, order: 91 },
  { slug: "system", title: "Система", roles: OWNER_ROLES, order: 92 },
];

/** Разделы ядра и включённых модулей. Выключенный модуль: его разделов нет. */
export function allSections(): AdminSection[] {
  const fromModules = enabledModules().flatMap((m) =>
    m.sections.map((section) => ({ ...section, module: m.id })),
  );
  return [...CORE_SECTIONS, ...fromModules].sort((a, b) => a.order - b.order);
}

export function findSection(slug: string): AdminSection | undefined {
  return allSections().find((s) => s.slug === slug);
}

export function canAccessSection(role: UserRole, slug: string): boolean {
  const section = findSection(slug);
  return section ? section.roles.includes(role) : false;
}

export function sectionsForRole(role: UserRole): AdminSection[] {
  return allSections().filter((s) => s.roles.includes(role));
}

export function sectionHref(slug: string): string {
  return slug ? `/admin/${slug}` : "/admin";
}

/**
 * Страница раздела зовёт это первой строкой. Нет сессии: на вход. Раздела нет
 * (или модуль выключен): 404. Роль не подходит: настоящий 403 через forbidden().
 */
export async function requireSection(slug: string): Promise<SessionUser> {
  const section = findSection(slug);
  if (!section) notFound();

  const user = await currentUser();
  if (!user) redirect("/admin/login");

  if (!section.roles.includes(user.role)) forbidden();
  return user;
}
