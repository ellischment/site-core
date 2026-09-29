// Маршрут модуля booking.
import type { Metadata } from "next";
import BookingsPage from "@/modules/booking/admin/BookingsPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Запись" };

export default async function Page({ searchParams }: PageProps<"/admin/booking">) {
  const { past } = await searchParams;
  return <BookingsPage past={past === "1"} />;
}
