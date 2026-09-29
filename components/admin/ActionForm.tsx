"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import type { FormState } from "@/lib/form-state";
import styles from "./admin.module.css";

function Submit({ label, variant }: { label: string; variant: "primary" | "ghost" | "danger" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} small={variant !== "primary"} disabled={pending}>
      {pending ? "Сохраняем" : label}
    </Button>
  );
}

/**
 * Форма админки на серверном действии. Ошибки поля показываются по имени
 * (errors[name]) через FieldError, общая ошибка и «Сохранено» сверху кнопки.
 */
export function ActionForm({
  action,
  submitLabel = "Сохранить",
  variant = "primary",
  resetOnSuccess = false,
  inline = false,
  children,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel?: string;
  variant?: "primary" | "ghost" | "danger";
  resetOnSuccess?: boolean;
  inline?: boolean;
  children?: ReactNode | ((state: FormState) => ReactNode);
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state.at, state.ok, resetOnSuccess]);

  const fieldErrors = Object.entries(state.errors ?? {}).filter(([key]) => key !== "form");

  return (
    <form ref={ref} action={formAction} className={inline ? styles.row : styles.form} noValidate>
      {typeof children === "function" ? children(state) : children}
      {state.errors?.form ? (
        <p className={styles.error} role="alert">
          {state.errors.form}
        </p>
      ) : null}
      {fieldErrors.length > 0 ? (
        <ul className={styles.error} role="alert">
          {fieldErrors.map(([key, message]) => (
            <li key={key}>{message}</li>
          ))}
        </ul>
      ) : null}
      {state.ok && state.message ? (
        <p className={styles.success} role="status">
          {state.message}
        </p>
      ) : null}
      <div>
        <Submit label={submitLabel} variant={variant} />
      </div>
    </form>
  );
}
