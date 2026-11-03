
import Navbar from "@/components/layout/navbar";
import { getPublicSiteData } from "@/lib/supabase/public-data";
import Hero from "@/components/sections/hero";
import {
  AboutSection,
  BeforeAfterSection,
  ContactSection,
  ProcessSection,
  ProjectsSection,
  ServicesSection,
  SiteFooter,
  TeamSection,
} from "@/components/sections/site-sections";

export const instant = false;

export default async function Home() {
  const { content, projects } = await getPublicSiteData();
  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-md bg-primary px-4 py-3 font-semibold text-[#07101a] focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:outline-white"
      >
        Skip to content
      </a>
      <Navbar email={content.email} logoSrc={content.logoImage} />
      <main id="main-content">
        <Hero content={content} />
        <AboutSection content={content} />
        <ServicesSection content={content} />
        <BeforeAfterSection content={content} />
        <ProjectsSection content={content} projects={projects.filter((project) => project.isFeatured ?? true)} />
        <ProcessSection content={content} />
        <TeamSection content={content} />
        <ContactSection content={content} />
      </main>
      <SiteFooter content={content} />
    </>
  );
}
