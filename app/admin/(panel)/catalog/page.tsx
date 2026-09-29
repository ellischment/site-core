// Маршрут модуля catalog.
import type { Metadata } from "next";
import CatalogPage from "@/modules/catalog/admin/CatalogPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Каталог" };
export default CatalogPage;
