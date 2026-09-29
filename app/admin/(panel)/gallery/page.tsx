// Маршрут модуля gallery.
import type { Metadata } from "next";
import GalleryPage from "@/modules/gallery/admin/GalleryPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Работы" };
export default GalleryPage;
