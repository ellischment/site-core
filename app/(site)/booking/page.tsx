// Маршрут модуля booking. Выключенный модуль: proxy отвечает 404 (lib/routing.ts).
import type { Metadata } from "next";
import { BookingPage } from "@/modules/booking/components/BookingPage";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Запись", alternates: { canonical: "/booking" } };

export default function Page() {
  return (
    <main className={styles.main}>
      <h1>Запись</h1>
      <BookingPage />
    </main>
  );
}
