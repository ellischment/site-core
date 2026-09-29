// Маршрут модуля booking.
import type { Metadata } from "next";
import TodayPage from "@/modules/booking/admin/TodayPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Сегодня" };
export default TodayPage;
