// Состояние формы админки для useActionState. Серверные действия отдают его,
// компонент ActionForm показывает ошибки и «Сохранено».

import type { ActionResult } from "./action";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Меняется на каждый успешный ответ: форма понимает, что пора очиститься. */
  at?: number;
};

export function toFormState<T>(result: ActionResult<T>, message = "Сохранено"): FormState {
  if (result.ok) return { ok: true, message, at: Date.now() };
  return { ok: false, errors: result.errors };
}

/** Поля формы в объект: чекбоксы как boolean, остальное строкой. */
export function formToObject(formData: FormData, booleans: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$")) continue; // служебные поля React
    if (typeof value === "string") out[key] = value;
  }
  for (const key of booleans) out[key] = formData.get(key) === "on" || formData.get(key) === "true";
  return out;
}
