import { config, isModuleEnabled } from "@/lib/config";
import { RequestBlock } from "@/modules/requests/components/RequestBlock";
import styles from "./page.module.css";

// Главная ядра. Блоки публичной части появляются на этапе 5.
export default function HomePage() {
  return (
    <main className={styles.main}>
      <h1>{config.name}</h1>
      <p>{config.seo.description}</p>
      {isModuleEnabled("requests") ? (
        <section aria-labelledby="request-title">
          <h2 id="request-title">Оставить заявку</h2>
          <RequestBlock />
        </section>
      ) : null}
    </main>
  );
}
