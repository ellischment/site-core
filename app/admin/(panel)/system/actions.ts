"use server";

import { z } from "zod";
import { panelAction } from "@/lib/action";
import { OWNER_ROLES } from "@/lib/constants";
import type { FormState } from "@/lib/form-state";

const terminate = panelAction({
  roles: OWNER_ROLES,
  schema: z.object({}),
  entity: "user",
  action: "session.terminateAll",
  // Удаляются все сессии, включая текущую: смысл кнопки выкинуть всех, если
  // доступ мог утечь. Владелец потом входит заново.
  run: async (_input, tx) => tx.session.deleteMany({}),
});

export async function terminateAllSessions(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("confirm") !== "yes") return { ok: false, errors: { form: "Действие не подтверждено" } };
  const result = await terminate({});
  if (!result.ok) return { ok: false, errors: result.errors };
  return { ok: true, message: `Завершено входов: ${result.data.count}. Обновите страницу и войдите заново.`, at: Date.now() };
}
