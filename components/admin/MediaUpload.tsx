"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { coverNotice, type CoverShape } from "@/lib/cover-notice";
import styles from "./admin.module.css";

/**
 * Загрузка фото к сущности. Несколько файлов за раз, по одному запросу на файл:
 * одна битая картинка не отменяет остальные. Подсказка про размер и пропорцию
 * появляется сразу, до загрузки, и ничего не запрещает.
 */
export function MediaUpload({ entity, entityId, shape }: { entity: string; entityId: string; shape: CoverShape }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  async function readSize(file: File): Promise<{ width: number; height: number } | null> {
    try {
      const bitmap = await createImageBitmap(file);
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return size;
    } catch {
      return null;
    }
  }

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    const out: string[] = [];
    for (const file of files) {
      const size = await readSize(file);
      const notice = coverNotice(shape, file.name, size?.width, size?.height);
      if (notice) out.push(notice);
      const body = new FormData();
      body.set("file", file);
      body.set("entity", entity);
      body.set("entityId", entityId);
      const res = await fetch("/api/media/upload", { method: "POST", body });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        out.push(`${file.name}: ${data.error ?? "не загрузилось"}`);
      }
    }
    setMessages(out);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {busy ? "Загружаем…" : "Добавить фото (JPEG, PNG, WebP до 10 МБ)"}
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onChange} disabled={busy} className={styles.input} />
      </label>
      {messages.length > 0 ? (
        <ul className={styles.hint} role="status">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
