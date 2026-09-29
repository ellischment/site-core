"use server";

import { z } from "zod";
import { ActionError, panelAction } from "@/lib/action";
import { ALL_ROLES, OWNER_ROLES } from "@/lib/constants";
import { formToObject, toFormState, type FormState } from "@/lib/form-state";
import { sendTelegram } from "@/lib/telegram";
import { REQUEST_STATUSES } from "./statuses";

const setStatus = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1), status: z.enum(REQUEST_STATUSES) }),
  entity: "request",
  action: "request.status",
  run: async (input, tx) => {
    const found = await tx.request.findUnique({ where: { id: input.id }, select: { id: true } });
    if (!found) throw new ActionError("Заявка не найдена, возможно, её уже удалили");
    await tx.request.update({ where: { id: input.id }, data: { status: input.status } });
    return { id: input.id };
  },
  entityId: (input) => input.id,
});

const remove = panelAction({
  roles: ALL_ROLES,
  schema: z.object({ id: z.string().min(1) }),
  entity: "request",
  action: "request.delete",
  run: async (input, tx) => {
    await tx.request.deleteMany({ where: { id: input.id } });
    return { id: input.id };
  },
  entityId: (input) => input.id,
});

const testNotify = panelAction({
  roles: OWNER_ROLES,
  schema: z.object({}),
  entity: "request",
  action: "request.testNotify",
  run: async () => {
    const result = await sendTelegram("Тестовое уведомление с сайта. Уведомления о новых заявках будут приходить в этот чат.");
    if (!result.ok) throw new ActionError(result.error);
    return {};
  },
});

export async function setRequestStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await setStatus(formToObject(fd)), "Статус изменён");
}

export async function deleteRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  return toFormState(await remove(formToObject(fd)), "Заявка удалена");
}

export async function sendTestNotification(): Promise<FormState> {
  return toFormState(await testNotify({}), "Отправлено, проверьте чат");
}
