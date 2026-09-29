import { config } from "@/lib/config";
import styles from "./page.module.css";

// Пустая главная ядра. Блоки публичной части появляются на этапе 5.
export default function HomePage() {
  return (
    <main className={styles.main}>
      <h1>{config.name}</h1>
      <p>{config.seo.description}</p>
    </main>
  );
}
