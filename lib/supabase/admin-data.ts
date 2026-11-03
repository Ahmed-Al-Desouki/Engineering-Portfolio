import "server-only";
import { createClient } from "@/lib/supabase/server";
import { siteContent, processSteps, homeBeforeAfter } from "@/lib/site-content";
import { projects as sampleProjects } from "@/lib/projects";

export async function AdminDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return null;

  const [{ data: siteRow, error: siteError }, { data: dbProjects, error: projectError }] = await Promise.all([
    supabase.from("site_content").select("content").eq("id", "main").maybeSingle(),
    supabase.from("projects").select("slug,title,summary,data,is_published,is_featured,sort_order").order("sort_order"),
  ]);
  if (siteError) throw new Error(siteError.message);
  if (projectError) throw new Error(projectError.message);

  const defaultContent = { ...siteContent, processSteps, homeBeforeAfter };
  const fallbackProjects = sampleProjects.map((project, index) => ({
    ...project, isPublished: false, isFeatured: index < 3, sortOrder: index,
  })).map((data) => ({ slug: data.slug, title: data.title, summary: data.summary, data: data as unknown as Record<string, unknown>, is_published: false, is_featured: Boolean(data.isFeatured), sort_order: Number(data.sortOrder), is_starter: true }));

  return { content: (siteRow?.content as Record<string, unknown> | undefined) ?? defaultContent, projects: dbProjects?.length ? dbProjects as typeof fallbackProjects : fallbackProjects, email: user.email ?? "Admin" };
}
