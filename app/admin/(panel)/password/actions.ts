"use server";

import { redirect } from "next/navigation";
import { ActionError, panelAction } from "@/lib/action";
import { currentUser, hashPassword, verifyCredentials } from "@/lib/auth";
import { ALL_ROLES } from "@/lib/constants";
import { formToObject, toFormState, type FormState } from "@/lib/form-state";
import { changeOwnPasswordSchema } from "@/lib/validation/user";

// Свой пароль меняет любая роль, а не только владелец через «Доступы».
const change = panelAction({
  roles: ALL_ROLES,
  schema: changeOwnPasswordSchema,
  entity: "user",
  action: "user.changeOwnPassword",
  run: async (input, tx) => {
    const user = await currentUser();
    if (!user) throw new ActionError("Сессия истекла, войдите заново");

    // Текущий пароль сверяется тем же путём, что и вход: постоянное время
    // сравнения и та же проверка «доступ не отключён».
    const confirmed = await verifyCredentials(user.email, input.current);
    if (!confirmed || confirmed.id !== user.id) throw new ActionError("Текущий пароль не подходит");
    if (input.current === input.password) throw new ActionError("Новый пароль совпадает со старым");

    await tx.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(input.password) } });
    // Все сессии завершаются, включая текущую: если пароль подсмотрели, чужой
    // открытый вход обязан закрыться.
    await tx.session.deleteMany({ where: { userId: user.id } });
    return { id: user.id };
  },
  entityId: (_input, output) => output.id,
});

export async function changeOwnPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await change(formToObject(formData));
  if (!result.ok) return toFormState(result);
  redirect("/admin/login?changed=1");
}
