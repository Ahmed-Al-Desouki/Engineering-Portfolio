import "server-only";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { homeBeforeAfter, processSteps, siteContent } from "@/lib/site-content";
import { projects as seedProjects, type Project } from "@/lib/projects";

const fallbackContent = { ...siteContent, processSteps, homeBeforeAfter };
export type ManagedSiteContent = typeof fallbackContent;

export async function getPublicSiteData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return { content: fallbackContent, projects: seedProjects };
  }
  try {
    await connection();
    const supabase = await createClient();
    const [{ data: siteRow, error: contentError }, { data: rows, error: projectsError }] = await Promise.all([
      supabase.from("site_content").select("content").eq("id", "main").maybeSingle(),
      supabase.from("projects").select("data").eq("is_published", true).order("sort_order"),
    ]);
    if (contentError || projectsError) throw contentError ?? projectsError;
    const managedProjects = (rows ?? []).map((row) => row.data as Project);
    return {
      content: (siteRow?.content as ManagedSiteContent | undefined) ?? fallbackContent,
      projects: rows ? managedProjects : seedProjects,
    };
  } catch {
    // Database setup is optional during development; use the local site content until connected.
    return { content: fallbackContent, projects: seedProjects };
  }
}
