import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import BeforeAfterSlider from "@/components/projects/before-after-slider";
import ProjectMediaGallery from "@/components/projects/project-media-gallery";
import { getPublicSiteData } from "@/lib/supabase/public-data";
import { SiteFooter } from "@/components/sections/site-sections";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { projects } = await getPublicSiteData();
  const project = projects.find((item) => item.slug === slug);
  return project
    ? { title: project.title, description: project.summary }
    : { title: "Project not found" };
}

export const instant = false;

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { content, projects } = await getPublicSiteData();
  return (
    <>
      <Suspense fallback={<div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-[72px] border-b border-white/10 bg-[#07101a]/85 backdrop-blur-lg md:h-[88px]" />}>
        <Navbar email={content.email} logoSrc={content.logoImage} />
      </Suspense>
      <Suspense fallback={<ProjectLoading />}>
        <ProjectDetails params={params} projects={projects} />
      </Suspense>
      <SiteFooter content={content} />
    </>
  );
}

function ProjectLoading() {
  return (
    <main aria-label="Loading project" className="min-h-screen bg-[#0b1118] px-6 pb-16 pt-[112px] md:px-10 md:pt-[136px] lg:px-14">
      <div className="mx-auto max-w-[1440px] animate-pulse">
        <div className="h-4 w-28 rounded bg-white/10" />
        <div className="mt-10 h-12 max-w-xl rounded bg-white/10" />
        <div className="mt-4 h-5 max-w-2xl rounded bg-white/10" />
        <div className="mt-12 aspect-[16/8] max-w-5xl rounded border border-white/10 bg-white/[0.03]" />
      </div>
    </main>
  );
}

async function ProjectDetails({ params, projects }: ProjectPageProps & { projects: Awaited<ReturnType<typeof getPublicSiteData>>["projects"] }) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) notFound();

  const media = [project.cover, ...project.gallery];

  return (
      <main className="min-h-screen bg-[#0b1118] pt-[72px] md:pt-[88px]">
        <div className="mx-auto max-w-[1440px] px-6 py-10 md:px-10 md:py-16 lg:px-14">
          <Link href="/projects" className="text-xs font-bold uppercase tracking-[0.18em] text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            ← All projects
          </Link>

          <header className="grid gap-7 border-b border-white/10 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              {project.isPreview && <p className="mb-3 w-fit border border-primary/40 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-primary">Illustrative preview · Not client work</p>}
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{project.category}</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">{project.title}</h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">{project.summary}</p>
            </div>
            {(project.year || project.location) && (
              <dl className="flex flex-wrap gap-x-8 gap-y-4 text-xs">
                {project.year && <div><dt className="text-white/40">Year</dt><dd className="mt-1 font-semibold text-white">{project.year}</dd></div>}
                {project.location && <div><dt className="text-white/40">Location</dt><dd className="mt-1 font-semibold text-white">{project.location}</dd></div>}
              </dl>
            )}
          </header>

          <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.7fr)] lg:gap-16 lg:py-14">
            <ProjectMediaGallery title={project.title} media={media} />
            <section aria-labelledby="project-overview-heading" className="self-start">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Project overview</p>
              <h2 id="project-overview-heading" className="mt-3 text-2xl font-black uppercase tracking-tight text-white">The brief</h2>
              <p className="mt-4 text-sm leading-7 text-white/65">{project.overview}</p>
              {project.systems && project.systems.length > 0 && (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Systems &amp; disciplines</h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {project.systems.map((system) => <li key={system} className="border border-white/15 px-3 py-2 text-xs text-white/75">{system}</li>)}
                  </ul>
                </div>
              )}
            </section>
          </div>

          {(project.challenge || project.solution || project.outcome) && (
            <section aria-label="Project details" className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
              {([
                ["Challenge", project.challenge],
                ["Solution", project.solution],
                ["Outcome", project.outcome],
              ] as const).map(([heading, detail]) => detail && (
                <article key={heading} className="bg-[#111a24] p-6 sm:p-8">
                  <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{heading}</h2>
                  <p className="mt-4 text-sm leading-7 text-white/65">{detail}</p>
                </article>
              ))}
            </section>
          )}

          {project.beforeAfter && (
            <div className="mt-16 lg:mt-24">
              <BeforeAfterSlider before={project.beforeAfter.before} after={project.beforeAfter.after} />
            </div>
          )}

          <div className="mt-16 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/55">Interested in a similar engineering conversation?</p>
            <Link href="/#contact" className="inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-[#07101a] transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              Get in touch <span aria-hidden="true" className="ml-3">→</span>
            </Link>
          </div>
        </div>
      </main>
  );
}
