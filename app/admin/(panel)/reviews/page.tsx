// Маршрут модуля reviews.
import type { Metadata } from "next";
import ReviewsPage from "@/modules/reviews/admin/ReviewsPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Отзывы" };
export default ReviewsPage;
