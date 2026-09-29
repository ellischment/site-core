import type { Metadata } from "next";
import Link from "next/link";
import { Panel, Table, adminStyles as styles } from "@/components/admin/Panel";
import { FontsView, PaletteView } from "@/components/TokenView";
import { requireSection } from "@/lib/admin-sections";
import { tokens } from "@/lib/theme";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Внешний вид" };

const SCHEME_TITLES = { system: "как в системе у посетителя", light: "светлая", dark: "тёмная" };

export default async function AppearancePage() {
  await requireSection("appearance");
  return (
    <>
      <h1>Внешний вид</h1>
      <p className={styles.hint}>
        Только просмотр. Цвета и шрифты задаются в theme/tokens.ts при сборке сайта. Все образцы на одной странице:{" "}
        <Link href="/styleguide">/styleguide</Link>.
      </p>
      <Panel title="Схема по умолчанию">
        <p>{SCHEME_TITLES[tokens.defaultScheme]}. Посетитель может переключить её сам.</p>
      </Panel>
      <Panel title="Цвета">
        <div className={styles.form} style={{ maxWidth: "none" }}>
          <PaletteView title="Светлая схема" palette={tokens.colors.light} />
          <PaletteView title="Тёмная схема" palette={tokens.colors.dark} />
        </div>
      </Panel>
      <Panel title="Шрифты">
        <FontsView tokens={tokens} />
      </Panel>
      <Panel title="Размеры">
        <Table head={["Токен", "Значение"]} label="Размеры">
          {Object.entries(tokens.fontSize).map(([k, v]) => (
            <tr key={`fs-${k}`}>
              <td>шрифт {k}</td>
              <td>{v}px</td>
            </tr>
          ))}
          {Object.entries(tokens.radius).map(([k, v]) => (
            <tr key={`r-${k}`}>
              <td>скругление {k}</td>
              <td>{v}px</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
