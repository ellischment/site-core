"use server";

import type { Prisma } from "@prisma/client";
import { ActionError, panelAction } from "@/lib/action";
import { hashPassword } from "@/lib/auth";
import { OWNER_ROLES } from "@/lib/constants";
import { formToObject, toFormState, type FormState } from "@/lib/form-state";
import { createUserSchema, resetPasswordSchema, toggleActiveSchema, updateRoleSchema } from "@/lib/validation/user";

const OWNERS = ["owner", "tech"];

/** Сколько владельцев останется, если этого не считать. Последнего снять нельзя: запрёшь себя. */
function ownersLeftAfter(tx: Prisma.TransactionClient, excludeUserId: string): Promise<number> {
  return tx.user.count({ where: { active: true, role: { in: OWNERS }, id: { not: excludeUserId } } });
}

const create = panelAction({
  roles: OWNER_ROLES,
  schema: createUserSchema,
  entity: "user",
  action: "user.create",
  run: async (input, tx) => {
    if (await tx.user.findUnique({ where: { email: input.email } })) {
      throw new ActionError("Доступ с такой почтой уже есть");
    }
    const user = await tx.user.create({
      data: { email: input.email, passwordHash: await hashPassword(input.password), role: input.role },
    });
    return { id: user.id };
  },
  entityId: (_input, output) => output.id,
});

const setRole = panelAction({
  roles: OWNER_ROLES,
  schema: updateRoleSchema,
  entity: "user",
  action: "user.role",
  run: async (input, tx) => {
    const user = await tx.user.findUnique({ where: { id: input.id } });
    if (!user) throw new ActionError("Доступ не найден");
    const losesOwner = OWNERS.includes(user.role) && !OWNERS.includes(input.role);
    if (losesOwner && user.active && (await ownersLeftAfter(tx, user.id)) === 0) {
      throw new ActionError("Это последний владелец, сначала назначьте другого");
    }
    await tx.user.update({ where: { id: user.id }, data: { role: input.role } });
    return { id: user.id };
  },
  entityId: (input) => input.id,
});

const setActive = panelAction({
  roles: OWNER_ROLES,
  schema: toggleActiveSchema,
  entity: "user",
  action: "user.active",
  run: async (input, tx) => {
    const user = await tx.user.findUnique({ where: { id: input.id } });
    if (!user) throw new ActionError("Доступ не найден");
    if (!input.active && OWNERS.includes(user.role) && (await ownersLeftAfter(tx, user.id)) === 0) {
      throw new ActionError("Это последний владелец, отключать его нельзя");
    }
    await tx.user.update({ where: { id: user.id }, data: { active: input.active } });
    if (!input.active) await tx.session.deleteMany({ where: { userId: user.id } });
    return { id: user.id };
  },
  entityId: (input) => input.id,
});

const resetPassword = panelAction({
  roles: OWNER_ROLES,
  schema: resetPasswordSchema,
  entity: "user",
  action: "user.password",
  run: async (input, tx) => {
    const user = await tx.user.findUnique({ where: { id: input.id } });
    if (!user) throw new ActionError("Доступ не найден");
    await tx.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(input.password) } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    return { id: user.id };
  },
  entityId: (input) => input.id,
});

export async function createUser(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await create(formToObject(fd)), "Доступ создан");
}

export async function updateUserRole(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await setRole(formToObject(fd)), "Роль изменена");
}

export async function toggleUserActive(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await setActive({ id: fd.get("id"), active: fd.get("active") === "true" }), "Готово");
}

export async function resetUserPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await resetPassword(formToObject(fd)), "Пароль задан, входы пользователя завершены");
}
