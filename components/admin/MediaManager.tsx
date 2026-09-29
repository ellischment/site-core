import { ActionForm } from "./ActionForm";
import { MediaUpload } from "./MediaUpload";
import { deleteMediaAction, moveMediaAction, setMediaAltAction } from "./media-actions";
import { CARD_COVER, type CoverShape } from "@/lib/cover-notice";
import { mediaFor } from "@/lib/media";
import styles from "./admin.module.css";

/** Фото сущности в админке: список, описание для незрячих, порядок, удаление, загрузка. */
export async function MediaManager({ entity, entityId, shape = CARD_COVER }: { entity: string; entityId: string; shape?: CoverShape }) {
  const items = await mediaFor(entity, entityId);
  return (
    <div className={styles.form} style={{ maxWidth: "none" }}>
      <p className={styles.label}>Фото. Первое идёт на обложку.</p>
      {items.length > 0 ? (
        <ul className={styles.mediaList}>
          {items.map((m, i) => (
            <li key={m.id} className={styles.mediaItem}>
              {/* eslint-disable-next-line @next/next/no-img-element -- превью в админке, оптимизация не нужна */}
              <img src={m.path ?? ""} alt={m.alt ?? ""} width={160} height={120} className={styles.mediaThumb} loading="lazy" />
              <ActionForm action={setMediaAltAction} submitLabel="Сохранить описание" variant="ghost">
                <input type="hidden" name="id" value={m.id} />
                <input className={styles.input} name="alt" defaultValue={m.alt ?? ""} placeholder="Что на фото" aria-label="Описание фото" />
              </ActionForm>
              <div className={styles.row}>
                {i > 0 ? (
                  <ActionForm action={moveMediaAction} submitLabel="Выше" variant="ghost" inline>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="dir" value="up" />
                  </ActionForm>
                ) : null}
                <ActionForm action={deleteMediaAction} submitLabel="Удалить фото" variant="danger" inline>
                  <input type="hidden" name="id" value={m.id} />
                </ActionForm>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <MediaUpload entity={entity} entityId={entityId} shape={shape} />
    </div>
  );
}
