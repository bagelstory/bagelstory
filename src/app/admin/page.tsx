import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/admin-app";

export const metadata: Metadata = {
  title: "Bagel Story — Cuisine",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
