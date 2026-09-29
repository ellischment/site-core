import { Field, adminStyles as styles } from "@/components/admin/Panel";

/** Поля формы без действия: только внешний вид. */
export function ActionFormPreview() {
  return (
    <div className={styles.form}>
      <Field label="Поле ввода">
        <input className={styles.input} placeholder="Подсказка" />
      </Field>
      <Field label="Список">
        <select className={styles.select} defaultValue="a">
          <option value="a">Первый</option>
        </select>
      </Field>
      <Field label="Текст" error="Так выглядит ошибка поля">
        <textarea className={styles.textarea} />
      </Field>
      <p className={styles.success}>Так выглядит «Сохранено»</p>
    </div>
  );
}
