// Маршрут модуля requests. Сам раздел: modules/requests/admin/RequestsPage.tsx.
import type { Metadata } from "next";
import RequestsPage from "@/modules/requests/admin/RequestsPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Заявки" };

export default async function Page({ searchParams }: PageProps<"/admin/requests">) {
  const { status } = await searchParams;
  return <RequestsPage status={typeof status === "string" ? status : undefined} />;
}
