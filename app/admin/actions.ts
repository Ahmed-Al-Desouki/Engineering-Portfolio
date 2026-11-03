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

export async function saveSiteContent(content: Record<string, unknown>) {
  const { supabase, user } = await requireAdmin();
  if (!content || typeof content !== "object" || Array.isArray(content)) throw new Error("Website content is invalid.");
  if (!Array.isArray(content.servicesList) || !Array.isArray(content.engineers) || !Array.isArray(content.processSteps)) {
    throw new Error("Check the services, engineers, and process steps lists.");
  }
  const { error } = await supabase.from("site_content").upsert({ id: "main", content, updated_by: user.id, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function saveProject(project: Record<string, unknown>, previousSlug = "") {
  const { supabase, user } = await requireAdmin();
  if (!project || typeof project !== "object" || Array.isArray(project)) throw new Error("A project must be a JSON object.");
  const slug = String(project.slug ?? "").trim();
  const title = String(project.title ?? "").trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Use a lowercase URL slug with hyphens only.");
  if (!title) throw new Error("Project title is required.");
  const cover = project.cover && typeof project.cover === "object" && !Array.isArray(project.cover) ? project.cover as Record<string, unknown> : null;
  if (project.isPublished === true && (!cover || !(cover.type === "image" || cover.type === "video") || typeof cover.src !== "string" || !cover.src.trim())) {
    throw new Error("Add a cover image or video before publishing. You can save the project as a draft without a cover.");
  }
  if (!Array.isArray(project.gallery)) throw new Error("Project gallery must be an array.");
  const { data: storedMedia, error: mediaError } = await supabase.from("media_assets").select("bytes").eq("project_slug", slug);
  if (mediaError) throw new Error(mediaError.message);
  const mediaBytes = (storedMedia ?? []).reduce((total, item) => total + Number(item.bytes), 0);
  if (mediaBytes > 100 * 1024 * 1024) throw new Error("This project's uploaded media exceeds 100 MB total.");
  const values = {
    slug, title, summary: String(project.summary ?? ""), data: project,
    is_published: project.isPublished === true,
    is_featured: project.isFeatured === true,
    sort_order: Number.isFinite(Number(project.sortOrder)) ? Number(project.sortOrder) : 0,
    updated_by: user.id, updated_at: new Date().toISOString(),
  };
  if (previousSlug && previousSlug !== slug) {
    const { data: attachedMedia, error: attachedMediaError } = await supabase.from("media_assets").select("asset_id").eq("project_slug", previousSlug).limit(1);
    if (attachedMediaError) throw new Error(attachedMediaError.message);
    if (attachedMedia?.length) throw new Error("This project slug cannot change after media is uploaded because the files are linked to its current folder.");
    const { error } = await supabase.from("projects").update(values).eq("slug", previousSlug);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase.from("projects").upsert(values, { onConflict: "slug" });
  if (error) throw new Error(error.message);
}

export async function deleteProject(slug: string) {
  const { supabase } = await requireAdmin();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Invalid project slug.");
  const { error } = await supabase.from("projects").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}
