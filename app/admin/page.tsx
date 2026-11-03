import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminDashboardData } from "@/lib/supabase/admin-data";
import AdminDashboard from "@/app/admin/admin-dashboard";

export const instant = false;

export default async function AdminPage() {
  await connection();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect("/admin/login");
  const data = await AdminDashboardData();
  if (!data) redirect("/admin/login");
  return <AdminDashboard {...data} />;
}
