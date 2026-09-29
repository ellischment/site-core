// SQLite через Prisma не поддерживает перечисления: допустимые значения строковых
// полей заданы здесь и проверяются валидацией.

export const USER_ROLES = ["owner", "admin", "tech"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Роли, которым открыты разделы владельца (доступы, журнал, система). */
export const OWNER_ROLES: readonly UserRole[] = ["owner", "tech"];
export const ALL_ROLES: readonly UserRole[] = USER_ROLES;

export const ROLE_TITLES: Record<UserRole, string> = {
  owner: "Владелец",
  admin: "Администратор",
  tech: "Технический доступ",
};

export const MEDIA_KINDS = ["image", "video"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];
