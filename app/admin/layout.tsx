import type { Metadata } from "next";

// Админка никогда не индексируется, на любом домене.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
