import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionFormPreview } from "./ActionFormPreview";
import { Badge, Panel, Table } from "@/components/admin/Panel";
import { Button, ButtonLink } from "@/components/Button";
import { FontsView, PaletteView } from "@/components/TokenView";
import { currentUser } from "@/lib/auth";
import { tokens } from "@/lib/theme";
import styles from "./styleguide.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Стайлгайд", robots: { index: false, follow: false } };

function Sample() {
  return (
    <div className={styles.sample}>
      <h1>Заголовок первого уровня</h1>
      <h2>Заголовок второго уровня</h2>
      <p className={styles.accent}>Акцентный заголовок</p>
      <p>
        Основной текст абзаца. Короткие предложения читаются легче. <a href="#">Ссылка в тексте</a>.
      </p>
      <p className={styles.muted}>Вторичный текст: подписи, пояснения.</p>
      <div className={styles.row}>
        <Button>Основная кнопка</Button>
        <Button variant="ghost">Второстепенная</Button>
        <Button variant="danger" small>
          Опасное действие
        </Button>
        <ButtonLink href="#" small>
          Ссылка-кнопка
        </ButtonLink>
      </div>
      <div className={styles.row}>
        <Badge tone="ok">готово</Badge>
        <Badge tone="warn">ждёт</Badge>
        <Badge tone="bad">ошибка</Badge>
        <Badge tone="info">новое</Badge>
      </div>
      <Panel title="Карточка" hint="Пояснение к карточке.">
        <Table head={["Столбец", "Значение"]} label="Пример таблицы">
          <tr>
            <td>Строка</td>
            <td>1 750 ₽</td>
          </tr>
        </Table>
      </Panel>
      <ActionFormPreview />
    </div>
  );
}

// Закрыта в проде: без входа в админку страница отвечает 404.
export default async function StyleguidePage() {
  if (process.env.NODE_ENV === "production" && !(await currentUser())) notFound();

  return (
    <main className={styles.main}>
      <h1>Стайлгайд</h1>
      <p>Все токены темы и базовые компоненты в светлой и тёмной схеме.</p>
      <section className={styles.fonts}>
        <FontsView tokens={tokens} />
      </section>
      <div className={styles.columns}>
        <section data-scheme="light" className={styles.scheme} aria-label="Светлая схема">
          <PaletteView title="Светлая схема" palette={tokens.colors.light} />
          <Sample />
        </section>
        <section data-scheme="dark" className={styles.scheme} aria-label="Тёмная схема">
          <PaletteView title="Тёмная схема" palette={tokens.colors.dark} />
          <Sample />
        </section>
      </div>
    </main>
  );
}
