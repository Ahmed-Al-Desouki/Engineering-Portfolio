"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navigationLinks = [
  { label: "Home", href: "/", section: "home" },
  { label: "About", href: "/#about", section: "about" },
  { label: "Services", href: "/#services", section: "services" },
  { label: "Projects", href: "/#projects", section: "projects" },
  { label: "Process", href: "/#process", section: "process" },
  { label: "Team", href: "/#team", section: "team" },
  { label: "Contact", href: "/#contact", section: "contact" },
];

export default function Navbar({ email = "valex.automation@outlook.com", logoSrc = "/images/valex-logo-reference.png" }: { email?: string; logoSrc?: string }) {
  const pathname = usePathname();
  const projectRouteActive = pathname.startsWith("/projects");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProjectsMenuOpen, setIsProjectsMenuOpen] = useState(false);
  const [isProjectsMenuHovered, setIsProjectsMenuHovered] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const desktopProjectsButtonRef = useRef<HTMLButtonElement>(null);
  const mobileProjectsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pathname !== "/") return;

    let frame = 0;
    const sectionIds = navigationLinks.map((link) => link.section);

    function updateActiveSection() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const marker = window.innerWidth >= 768 ? 100 : 84;
        const sections = sectionIds
          .map((id) => document.getElementById(id))
          .filter((section): section is HTMLElement => section !== null);
        const current = sections.find((section) => {
          const bounds = section.getBoundingClientRect();
          return bounds.top <= marker && bounds.bottom > marker;
        });

        if (current) setActiveSection(current.id);
      });
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen && !isProjectsMenuOpen && !isProjectsMenuHovered) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isMenuOpen) {
          setIsMenuOpen(false);
          setIsProjectsMenuOpen(false);
          menuButtonRef.current?.focus();
        } else {
          setIsProjectsMenuOpen(false);
          setIsProjectsMenuHovered(false);
          (pathname === "/" || projectRouteActive
            ? desktopProjectsButtonRef.current
            : mobileProjectsButtonRef.current)?.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen, isProjectsMenuOpen, isProjectsMenuHovered, pathname, projectRouteActive]);

  const isProjectsMenuVisible = isProjectsMenuOpen || isProjectsMenuHovered;

  function closeMenus() {
    setIsMenuOpen(false);
    setIsProjectsMenuOpen(false);
  }

  function linkIsActive(section: string) {
    return section === "projects"
      ? projectRouteActive || (pathname === "/" && activeSection === "projects")
      : pathname === "/" && activeSection === section;
  }

  function navLinkClass(section: string) {
    const active = linkIsActive(section);
    return `relative py-2 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
      active
        ? "text-primary after:absolute after:inset-x-0 after:-bottom-1 after:h-[2px] after:bg-primary"
        : "text-white/75"
    }`;
  }

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#07101a]/85 backdrop-blur-lg">
      <nav
        aria-label="Main navigation"
        className="relative mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-6 md:h-[88px] lg:px-12 xl:px-16"
      >
        <Link
          href="/"
          className="flex flex-col border-r border-white/35 pr-5 leading-none md:pr-8"
          onClick={() => setActiveSection("home")}
        >
          <Image
            src={logoSrc}
            alt="VALEX Automation — Industrial Automation & Smart Systems"
            width={478}
            height={205}
            priority
            className="h-[69px] w-40 object-contain md:h-[79px] md:w-[184px]"
          />
        </Link>

        <div className="hidden items-center gap-5 xl:flex 2xl:gap-7">
          {navigationLinks.map((link) => link.section === "projects" ? (
            <div
              key={link.label}
              className="relative flex items-center gap-1"
              onMouseEnter={() => setIsProjectsMenuHovered(true)}
              onMouseLeave={() => setIsProjectsMenuHovered(false)}
              onFocus={() => setIsProjectsMenuOpen(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsProjectsMenuOpen(false);
                }
              }}
            >
              <Link
                href={link.href}
                aria-haspopup="true"
                aria-expanded={isProjectsMenuVisible}
                aria-current={pathname === "/" && activeSection === "projects" ? "location" : undefined}
                className={navLinkClass(link.section)}
                onClick={closeMenus}
              >
                {link.label}
              </Link>
              <button
                ref={desktopProjectsButtonRef}
                type="button"
                aria-label="Show project navigation options"
                aria-expanded={isProjectsMenuVisible}
                aria-controls="desktop-project-links"
                onClick={() => setIsProjectsMenuOpen((open) => !open)}
                className={`rounded p-1 text-white/60 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary ${linkIsActive(link.section) ? "text-primary" : ""}`}
              >
                <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-3 transition-transform ${isProjectsMenuVisible ? "rotate-180" : ""}`}>
                  <path d="m3 6 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                </svg>
              </button>
              <div
                id="desktop-project-links"
                hidden={!isProjectsMenuVisible}
                className="absolute left-1/2 top-full z-50 w-48 -translate-x-1/2 pt-3"
              >
                <div className="rounded-lg border border-white/10 bg-[#0b1118] p-2 shadow-2xl">
                  <Link href="/#projects" onClick={closeMenus} className="block rounded-md px-3 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
                    Projects section
                  </Link>
                  <Link href="/projects" onClick={closeMenus} aria-current={projectRouteActive ? "page" : undefined} className="block rounded-md px-3 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
                    All projects
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <Link
              key={link.label}
              href={link.href}
              aria-current={linkIsActive(link.section) ? "location" : undefined}
              className={navLinkClass(link.section)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href={`mailto:${email}`}
          className="group ml-auto mr-3 hidden items-center gap-2 rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary hover:text-[#0b1118] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:flex md:ml-0 md:mr-0"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
            <rect x="2.5" y="4" width="15" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="m3.5 5 6.5 5 6.5-5" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
          <span>Let&apos;s Talk</span>
          <span aria-hidden="true" className="text-lg text-primary transition-transform group-hover:translate-x-1 group-hover:text-[#0b1118]">
            →
          </span>
        </Link>

        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:hidden"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => {
            setIsMenuOpen((open) => !open);
            setIsProjectsMenuOpen(false);
          }}
        >
          <span className="sr-only">{isMenuOpen ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className="flex w-5 flex-col gap-[5px]">
            <span className={`h-0.5 w-full bg-current transition-transform ${isMenuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`h-0.5 w-full bg-current transition-opacity ${isMenuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-full bg-current transition-transform ${isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </span>
        </button>

        <div
          id="mobile-navigation"
          hidden={!isMenuOpen}
          className="absolute inset-x-0 top-full border-b border-white/10 bg-[#0b1118] px-6 py-4 shadow-2xl xl:hidden"
        >
          <div className="flex flex-col">
            {navigationLinks.map((link) => link.section === "projects" ? (
              <div key={link.label}>
                <button
                  ref={mobileProjectsButtonRef}
                  type="button"
                  aria-expanded={isProjectsMenuOpen}
                  aria-controls="mobile-project-links"
                  aria-current={linkIsActive(link.section) ? "location" : undefined}
                  onClick={() => setIsProjectsMenuOpen((open) => !open)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-white/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary ${linkIsActive(link.section) ? "text-primary" : "text-text-secondary"}`}
                >
                  Projects
                  <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-4 transition-transform ${isProjectsMenuOpen ? "rotate-180" : ""}`}>
                    <path d="m3 6 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                  </svg>
                </button>
                <div id="mobile-project-links" hidden={!isProjectsMenuOpen} className="ml-3 border-l border-primary/35 pl-3">
                  <Link href="/#projects" onClick={closeMenus} aria-current={pathname === "/" && activeSection === "projects" ? "location" : undefined} className="block rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
                    Projects section
                  </Link>
                  <Link href="/projects" onClick={closeMenus} aria-current={projectRouteActive ? "page" : undefined} className="block rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
                    All projects
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                aria-current={linkIsActive(link.section) ? "location" : undefined}
                onClick={closeMenus}
                className={`rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-white/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary ${linkIsActive(link.section) ? "text-primary" : "text-text-secondary"}`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={`mailto:${email}`}
              onClick={closeMenus}
              className="mt-2 rounded-full border border-primary/40 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary hover:text-[#0b1118] focus-visible:outline-2 focus-visible:outline-primary"
            >
              Let&apos;s Talk
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
