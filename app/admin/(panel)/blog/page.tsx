// Маршрут модуля blog.
import type { Metadata } from "next";
import BlogPage from "@/modules/blog/admin/BlogPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Блог" };
export default BlogPage;
