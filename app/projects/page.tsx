import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import ProjectCard from "@/components/projects/project-card";
import { SiteFooter } from "@/components/sections/site-sections";
import { getPublicSiteData } from "@/lib/supabase/public-data";

export const metadata: Metadata = {
  title: "Projects",
  description: "Explore VALEX AUTOMATION project stories and engineering work.",
};

export const instant = false;

export default async function ProjectsPage() {
  const { content, projects } = await getPublicSiteData();
  return (
    <>
      <Suspense fallback={<div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-[72px] border-b border-white/10 bg-[#07101a]/85 backdrop-blur-lg md:h-[88px]" />}>
        <Navbar email={content.email} logoSrc={content.logoImage} />
      </Suspense>
      <main className="min-h-screen bg-[#0b1118] pt-[72px] md:pt-[88px]">
        <section className="border-b border-white/10 bg-[#111a24]">
          <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-24 lg:px-14">
            <Link href="/#projects" className="text-xs font-bold uppercase tracking-[0.18em] text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              ← Back to home
            </Link>
            <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">VALEX AUTOMATION / PROJECTS</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Engineering in <span className="text-primary">action.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
              Explore verified project stories, technical details, and visual documentation from VALEX AUTOMATION.
            </p>
          </div>
        </section>

        <section aria-label="Project gallery" className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-24 lg:px-14">
          {projects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project, index) => <ProjectCard key={project.slug} project={project} slot={index + 1} />)}
            </div>
          ) : (
            <div className="relative overflow-hidden border border-white/10 bg-[#101923] px-6 py-16 text-center sm:px-12 sm:py-24">
              <div aria-hidden="true" className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:40px_40px]" />
              <div className="relative mx-auto max-w-xl">
                <span className="font-mono text-sm tracking-[0.3em] text-primary">VA / 00</span>
                <h2 className="mt-5 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">The project gallery is taking shape.</h2>
                <p className="mt-4 text-sm leading-7 text-white/55">
                  Verified project stories and media will appear here when they are added to the portfolio.
                </p>
                <Link href="/#contact" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full border border-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary hover:text-[#07101a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                  Contact VALEX
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter content={content} />
    </>
  );
}
