import { contrastRatio, CONTRAST_PAIRS } from "@/lib/contrast";
import { COLOR_KEYS, type Palette, type ThemeTokens } from "@/lib/theme-schema";
import styles from "./TokenView.module.css";

const COLOR_TITLES: Record<string, string> = {
  bg: "Фон",
  surface: "Поверхность",
  surface2: "Вторая поверхность",
  text: "Текст",
  textMuted: "Вторичный текст",
  border: "Линии",
  accent: "Акцент",
  accentSoft: "Мягкий акцент",
  onAccent: "Текст на акценте",
  danger: "Ошибка",
  ok: "Успех",
  warn: "Внимание",
};

/** Цвета схемы с образцами и проверкой контраста. Только чтение. */
export function PaletteView({ title, palette }: { title: string; palette: Palette }) {
  return (
    <div className={styles.block}>
      <h3>{title}</h3>
      <ul className={styles.swatches}>
        {COLOR_KEYS.map((key) => (
          <li key={key} className={styles.swatch}>
            <span className={styles.chip} style={{ background: palette[key] }} aria-hidden="true" />
            <span>
              {COLOR_TITLES[key]}
              <br />
              <code>{palette[key]}</code>
            </span>
          </li>
        ))}
      </ul>
      <ul className={styles.pairs}>
        {CONTRAST_PAIRS.map((p) => {
          const ratio = contrastRatio(palette[p.fg as keyof Palette], palette[p.bg as keyof Palette]);
          return (
            <li key={p.what}>
              {p.what}: <b>{ratio.toFixed(1)}</b> {ratio >= p.min ? "проходит" : `ниже ${p.min}`}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function FontsView({ tokens }: { tokens: ThemeTokens }) {
  const roles = [
    ["display", "Заголовки"],
    ["accent", "Акцентные заголовки"],
    ["body", "Текст"],
    ["ui", "Кнопки и подписи"],
  ] as const;
  return (
    <ul className={styles.fonts}>
      {roles.map(([role, title]) => {
        const f = tokens.fonts[role];
        return (
          <li key={role}>
            <span className={styles.fontSample} style={{ fontFamily: `var(--font-${role})`, fontStyle: `var(--font-${role}-style)`, textTransform: `var(--font-${role}-transform)` as "none", letterSpacing: `var(--font-${role}-spacing)` }}>
              Съешь же ещё этих мягких булок
            </span>
            <span className={styles.fontMeta}>
              {title}: {f.family || "системный"}
              {f.italic ? ", курсив" : ""}
              {f.uppercase ? ", капслок" : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
