"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) throw new Error("This account is not authorized to manage the VALEX website.");
  return { supabase, user };
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/admin/login?error=missing");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=credentials");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=credentials");
  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }
  redirect("/admin");
}

export async function signOut() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveSiteContent(raw: string) {
  const { supabase, user } = await requireAdmin();
  let content: unknown;
  try { content = JSON.parse(raw); } catch { throw new Error("Site content must be valid JSON."); }
  if (!content || typeof content !== "object" || Array.isArray(content)) throw new Error("Site content must be a JSON object.");
  const managed = content as Record<string, unknown>;
  if (!Array.isArray(managed.servicesList) || !Array.isArray(managed.engineers) || managed.engineers.length < 2 || !Array.isArray(managed.processSteps)) {
    throw new Error("Keep the services, at least two engineers, and process steps as arrays so the public sections remain valid.");
  }
  const { error } = await supabase.from("site_content").upsert({ id: "main", content, updated_by: user.id, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function saveProject(raw: string) {
  const { supabase, user } = await requireAdmin();
  let project: Record<string, unknown>;
  try { project = JSON.parse(raw) as Record<string, unknown>; } catch { throw new Error("Project data must be valid JSON."); }
  if (!project || typeof project !== "object" || Array.isArray(project)) throw new Error("A project must be a JSON object.");
  const slug = String(project.slug ?? "").trim();
  const title = String(project.title ?? "").trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Use a lowercase URL slug with hyphens only.");
  if (!title) throw new Error("Project title is required.");
  if (typeof project.category !== "string" || typeof project.summary !== "string" || typeof project.overview !== "string") throw new Error("Add a category, summary, and project overview before saving.");
  if (!project.cover || typeof project.cover !== "object" || Array.isArray(project.cover)) throw new Error("Add a cover image or video to the project.");
  const cover = project.cover as Record<string, unknown>;
  if (!(cover.type === "image" || cover.type === "video") || typeof cover.src !== "string" || !cover.src.trim()) throw new Error("The project cover needs a supported media type and URL.");
  if (!Array.isArray(project.gallery)) throw new Error("Project gallery must be an array.");
  const { data: storedMedia, error: mediaError } = await supabase.from("media_assets").select("bytes").eq("project_slug", slug);
  if (mediaError) throw new Error(mediaError.message);
  const mediaBytes = (storedMedia ?? []).reduce((total, item) => total + Number(item.bytes), 0);
  if (mediaBytes > 100 * 1024 * 1024) throw new Error("This project's uploaded media exceeds 100 MB total.");
  const { error } = await supabase.from("projects").upsert({
    slug, title, summary: String(project.summary ?? ""), data: project,
    is_published: project.isPublished === true,
    is_featured: project.isFeatured === true,
    sort_order: Number.isFinite(Number(project.sortOrder)) ? Number(project.sortOrder) : 0,
    updated_by: user.id, updated_at: new Date().toISOString(),
  }, { onConflict: "slug" });
  if (error) throw new Error(error.message);
}

export async function deleteProject(slug: string) {
  const { supabase } = await requireAdmin();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Invalid project slug.");
  const { error } = await supabase.from("projects").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}
