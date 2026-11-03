import Link from "next/link";
import Image from "next/image";
import BeforeAfterSlider from "@/components/projects/before-after-slider";
import ProjectCard from "@/components/projects/project-card";
import { projects as seedProjects, type Project } from "@/lib/projects";
import { homeBeforeAfter, processSteps, siteContent } from "@/lib/site-content";
import type { ManagedSiteContent } from "@/lib/supabase/public-data";

const defaultContent: ManagedSiteContent = { ...siteContent, processSteps, homeBeforeAfter };

function ImagePlaceholder({
  label,
  className = "aspect-[16/10]",
  src,
  alt = label,
}: {
  label: string;
  className?: string;
  src?: string;
  alt?: string;
}) {
  if (src) {
    return (
      <div className={`relative isolate overflow-hidden rounded-2xl bg-[#111b26] shadow-[0_24px_70px_rgba(0,0,0,0.3)] ${className}`}>
        <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Image placeholder: ${label}`}
      className={`group relative isolate overflow-hidden border border-white/10 bg-[#111b26] ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_25%,rgba(245,166,35,0.14),transparent_42%),linear-gradient(135deg,#182633,#0b1118_70%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:36px_36px]"
      />
      <div aria-hidden="true" className="absolute inset-4 border border-white/10 sm:inset-6" />
      <div className="absolute left-4 top-4 flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] text-white/55 sm:left-6 sm:top-6">
        <span className="size-1.5 rounded-full bg-primary" />
        IMAGE SLOT
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center">
        <svg aria-hidden="true" viewBox="0 0 48 48" className="size-10 text-primary/70">
          <rect x="7" y="9" width="34" height="30" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="m10 34 10-10 6 6 5-5 7 9" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span className="max-w-[260px] text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
          {label}
        </span>
      </div>
      <span aria-hidden="true" className="absolute bottom-0 left-0 h-px w-1/3 bg-primary/70 transition-all duration-500 group-hover:w-full" />
    </div>
  );
}

function SectionShell({
  id,
  number,
  label,
  title,
  description,
  tone = "dark",
  compactHeader = false,
  children,
}: {
  id: string;
  number: string;
  label: string;
  title: string;
  description?: string;
  tone?: "dark" | "light";
  compactHeader?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`border-t border-white/10 ${tone === "light" ? "bg-[#111a24]" : "bg-[#0b1118]"}`}
    >
      <div className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-20 pt-8 sm:pb-24 sm:pt-9 md:px-10 lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-12 lg:px-14 lg:pb-32 lg:pt-9">
        <aside className="flex items-center gap-4 lg:block">
          <span className="font-mono text-3xl font-bold tracking-tight text-primary/85 lg:block lg:text-7xl">
            {number}
          </span>
          <div className="flex flex-1 items-center gap-3 lg:mt-3 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55 lg:text-[11px]">
              {label}
            </p>
            <span aria-hidden="true" className="h-px flex-1 bg-primary/60 lg:mt-4 lg:block lg:w-14" />
          </div>
        </aside>

        <div className="min-w-0">
          <header className={`max-w-4xl ${compactHeader ? "mb-6 sm:mb-6" : "mb-10 sm:mb-14"}`}>
            <h2 className="text-3xl font-black uppercase leading-[1.04] tracking-[-0.045em] text-white sm:text-4xl md:text-5xl lg:text-6xl">
              {title}
            </h2>
            {description && (
              <p className="mt-5 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base sm:leading-8">
                {description}
              </p>
            )}
          </header>
          {children}
        </div>
      </div>
    </section>
  );
}

export function AboutSection({ content = defaultContent }: { content?: ManagedSiteContent }) {
  return (
    <SectionShell
      id="about"
      number="01"
      label="About VALEX"
      title={content.about.title}
      description={content.about.description}
      tone="light"
      compactHeader
    >
      <div className="grid items-start gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12">
        <div className="flex flex-col justify-between gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Engineering Beyond Limits
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
              {content.about.description}
            </p>
          </div>
          <div className="grid grid-cols-2 border-t border-white/15 pt-5">
            <div>
              <p className="text-4xl font-black tracking-tight text-white">{String(content.engineers.length).padStart(2, "0")}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                Engineers
              </p>
            </div>
            <div className="border-l border-white/15 pl-5">
              <p className="text-sm font-bold uppercase leading-6 text-white">
                10th of Ramadan City
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                Sharkia · Egypt
              </p>
            </div>
          </div>
        </div>
        <ImagePlaceholder label="Company or team image" className="aspect-video w-full" src={content.about.image?.src} alt={content.about.image?.alt} />
      </div>
    </SectionShell>
  );
}

export function ServicesSection({ content = defaultContent }: { content?: ManagedSiteContent }) {
  return (
    <SectionShell
      id="services"
      number="02"
      label="Services"
      title={content.services.title}
      description={content.services.description}
      tone="light"
    >
      <ol className="border-t border-white/20">
        {content.servicesList.map((service, index) => (
          <li
            key={service.title}
            className="grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 gap-y-1 border-b border-white/15 py-4 sm:gap-x-5 sm:py-[18px] md:grid-cols-[56px_minmax(240px,0.8fr)_1.2fr] md:items-center md:gap-x-6"
          >
            <span className="row-span-2 self-start pt-1 font-mono text-xs text-primary md:row-span-1 md:self-center md:pt-0">0{index + 1}</span>
            <h3 className="text-base font-bold uppercase tracking-tight text-white sm:text-lg">{service.title}</h3>
            <p className="col-start-2 text-sm leading-6 text-white/60 md:col-start-auto">{service.description}</p>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

export function BeforeAfterSection({ content = defaultContent }: { content?: ManagedSiteContent }) {
  return (
    <SectionShell
      id="before-after"
      number="03"
      label="Before / After"
      title={content.beforeAfter.title}
      description={content.beforeAfter.description}
    >
      <div className="mx-auto w-full max-w-[820px]">
        <BeforeAfterSlider before={content.homeBeforeAfter.before} after={content.homeBeforeAfter.after} showTitle={false} />
        <p role="note" className="mt-4 flex items-start gap-2 text-xs leading-6 text-white/50">
          <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          {content.beforeAfter.note}
        </p>
      </div>
    </SectionShell>
  );
}

export function ProjectsSection({ content = defaultContent, projects = seedProjects }: { content?: ManagedSiteContent; projects?: Project[] }) {
  return (
    <SectionShell
      id="projects"
      number="04"
      label="Projects"
      title={content.projects.title}
      description={content.projects.description}
      tone="light"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <ProjectCard key={projects[index]?.slug ?? `slot-${index + 1}`} project={projects[index]} slot={index + 1} />
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/55">Explore every published project and its technical story.</p>
        <Link href="/projects" className="inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-full border border-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary hover:text-[#07101a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          View all projects <span aria-hidden="true">→</span>
        </Link>
      </div>
    </SectionShell>
  );
}

export function ProcessSection({ content = defaultContent }: { content?: ManagedSiteContent }) {
  return (
    <SectionShell
      id="process"
      number="05"
      label="Process"
      title={content.process.title}
      description={content.process.description}
    >
      <ol className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-5">
        {content.processSteps.map((step, index) => (
          <li key={step.title} className="flex min-h-56 flex-col bg-[#101923] p-6 sm:p-7">
            <span className="font-mono text-sm text-primary">0{index + 1}</span>
            <div aria-hidden="true" className="my-7 h-px w-full bg-white/15"><span className="block h-px w-8 bg-primary" /></div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">{step.title}</h3>
            <p className="mt-2 text-xs leading-6 text-white/55">{step.description}</p>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

export function TeamSection({ content = defaultContent }: { content?: ManagedSiteContent }) {
  return (
    <SectionShell
      id="team"
      number="06"
      label="The engineers"
      title={content.team.title}
      description={content.team.description}
      tone="light"
    >
      <div className="grid gap-5 md:grid-cols-2">
        {content.engineers.map((engineer, index) => (
          <article key={engineer.phone} className="grid gap-5 border border-white/10 bg-[#0b1118] p-4 sm:grid-cols-[0.9fr_1.1fr] sm:gap-6 sm:p-5">
            <ImagePlaceholder label={`Portrait of engineer ${index + 1}`} className="aspect-[4/5] min-h-[220px]" src={engineer.image?.src} alt={engineer.image?.alt} />
            <div className="flex flex-col justify-end py-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Engineer 0{index + 1}</span>
              <h3 className="mt-3 text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
                {engineer.name}
              </h3>
              <a
                href={`tel:${engineer.phone}`}
                className="mt-6 inline-flex w-fit items-center gap-2 border-b border-primary/50 pb-2 text-sm font-semibold text-white transition-colors hover:text-primary"
              >
                {engineer.phone}
                <span aria-hidden="true" className="text-primary">↗</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function ContactSection({ content = defaultContent }: { content?: ManagedSiteContent }) {
  return (
    <SectionShell
      id="contact"
      number="07"
      label="Contact"
      title={content.contact.title}
      description={content.contact.description}
    >
      <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
        <a
          href={`mailto:${content.email}`}
          className="group bg-[#111a24] p-6 transition-colors hover:bg-[#172431] sm:p-8"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Email</span>
          <span className="mt-4 block break-all text-sm font-semibold text-white sm:text-base">{content.email}</span>
          <span aria-hidden="true" className="mt-8 block text-xl text-white/45 transition-transform group-hover:translate-x-1 group-hover:text-primary">→</span>
        </a>
        {content.engineers.map((engineer) => <a key={engineer.phone} href={`tel:${engineer.phone}`} className="group bg-[#111a24] p-6 transition-colors hover:bg-[#172431] sm:p-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{engineer.name}</span>
          <span className="mt-4 block text-sm font-semibold text-white sm:text-base">{engineer.phone}</span>
          <span aria-hidden="true" className="mt-8 block text-xl text-white/45 transition-transform group-hover:translate-x-1 group-hover:text-primary">→</span>
        </a>)}
        <div className="bg-[#111a24] p-6 sm:p-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Location</span>
          <span className="mt-4 block text-sm font-semibold leading-6 text-white sm:text-base">{content.location}</span>
          <span className="mt-8 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{content.brand}</span>
        </div>
      </div>
    </SectionShell>
  );
}

export function SiteFooter({ content = defaultContent }: { content?: ManagedSiteContent }) {
  const footerLinks = [
    ["About", "/#about"],
    ["Services", "/#services"],
    ["Projects", "/projects"],
    ["Process", "/#process"],
    ["Team", "/#team"],
    ["Contact", "/#contact"],
  ];

  return (
    <footer className="border-t border-white/10 bg-[#080d13]">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-12 md:px-10 lg:grid-cols-[1.2fr_1fr] lg:px-14 lg:py-16">
        <div>
          <Link href="/" aria-label="VALEX Automation home" className="inline-flex">
            <Image
              src={content.logoImage}
              alt="VALEX Automation — Industrial Automation & Smart Systems"
              width={478}
              height={205}
              className="h-[88px] w-[205px] object-contain"
            />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/50">
            Industrial Automation &amp; Smart Systems.
          </p>
        </div>

        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Navigation</h2>
          <nav aria-label="Footer navigation" className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
            {footerLinks.map(([label, href]) => (
              <Link key={label} href={href} className="text-xs font-medium text-white/55 transition-colors hover:text-primary">
                {label}
              </Link>
            ))}
          </nav>
          <a href={`mailto:${content.email}`} className="mt-6 inline-block text-xs text-white/65 transition-colors hover:text-primary">
            {content.email}
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 text-[9px] font-medium uppercase tracking-[0.14em] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© {content.brand}</span>
          <span>{content.locationLine}</span>
        </div>
      </div>
    </footer>
  );
}
