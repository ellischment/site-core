// Маршрут модуля booking.
import type { Metadata } from "next";
import SettingsPage from "@/modules/booking/admin/SettingsPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Услуги и часы" };
export default SettingsPage;
