import { siteContent } from "@/lib/site-content";
import type { ManagedSiteContent } from "@/lib/supabase/public-data";

const brandValues = [
  { label: "AUTOMATE", icon: "gear" },
  { label: "OPTIMIZE", icon: "chart" },
  { label: "INNOVATE", icon: "bulb" },
];

function ValueIcon({ name }: { name: string }) {
  const sharedProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  if (name === "gear") {
    return (
      <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8 text-primary sm:size-9" {...sharedProps}>
        <path d="M13 3h6l1 3.2 2.2 1.3 3.1-1 3 5.2-2.3 2.3v2.6l2.3 2.3-3 5.2-3.1-1-2.2 1.3L19 27h-6l-1-3.2-2.2-1.3-3.1 1-3-5.2L6 16l-2.3-2.3 3-5.2 3.1 1L12 8.2 13 3Z" />
        <circle cx="16" cy="16" r="4" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8 text-primary sm:size-9" {...sharedProps}>
        <path d="M4 27h25M7 23v-7h5v7m4 0V11h5v12m4 0V5h5v18" />
        <path d="m6 12 8-5 5 2 8-5" />
        <path d="M23 4h4v4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8 text-primary sm:size-9" {...sharedProps}>
      <path d="M10 22c0-2.3-4-4.5-4-9a10 10 0 0 1 20 0c0 4.5-4 6.7-4 9H10Z" />
      <path d="M12 26h8m-7 3h6m-3-19v7m-3-4 3 3 3-3" />
    </svg>
  );
}

export default function Hero({ content = { ...siteContent } as ManagedSiteContent }: { content?: ManagedSiteContent }) {
  return (
    <section
      id="home"
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#07101a] pt-20 md:pt-24"
    >
      <div
        aria-hidden="true"
        style={{ backgroundImage: `url("${content.hero.backgroundImage}")` }}
        className="absolute inset-0 -z-20 bg-cover bg-[center_54%] bg-no-repeat md:bg-[center_50%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#07101a_0%,rgba(7,16,26,0.97)_17%,rgba(7,16,26,0.89)_36%,rgba(7,16,26,0.54)_57%,rgba(7,16,26,0.12)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(7,16,26,0.92)_0%,rgba(7,16,26,0.14)_32%,rgba(7,16,26,0.28)_100%)]"
      />

      <svg
        aria-hidden="true"
        viewBox="0 0 900 700"
        preserveAspectRatio="none"
        className="pointer-events-none absolute right-0 top-[12%] z-0 hidden h-[76%] w-[58%] overflow-visible opacity-60 md:block"
      >
        <path
          d="M30 525 210 420h118l106-108h122l113-112h170"
          fill="none"
          stroke="#f5a623"
          strokeDasharray="650"
          strokeWidth="1.4"
          className="hero-circuit-line"
        />
        <path
          d="M180 690 330 570h120l92-96h95l106-106h104"
          fill="none"
          stroke="#77a9cc"
          strokeDasharray="650"
          strokeWidth="1.2"
          className="hero-circuit-line"
          style={{ animationDelay: "-4.5s" }}
        />
        <circle cx="839" cy="305" r="4" fill="#f5a623" className="hero-circuit-node" />
        <circle cx="743" cy="368" r="3" fill="#77a9cc" className="hero-circuit-node" style={{ animationDelay: "-1.2s" }} />
      </svg>

      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-6 lg:px-12 xl:px-16">
        <div className="my-auto max-w-[1040px] py-12 sm:py-16 lg:py-20">
          <div className="hero-reveal hero-reveal-1 mb-6 flex items-center gap-4 sm:mb-7">
            <span aria-hidden="true" className="h-[5px] w-10 rounded-full bg-primary sm:w-14" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 sm:text-xs sm:tracking-[0.27em]">
              {content.hero.eyebrow}
            </p>
          </div>

          <h1
            aria-label="Engineering Beyond Limits. We automate, optimize, and innovate."
            className="hero-reveal hero-reveal-2 text-[clamp(2.25rem,7.6vw,7.25rem)] font-black leading-[0.98] tracking-[-0.065em] text-white"
          >
            WE{" "}
            <span className="relative inline-grid align-baseline text-primary">
              <span aria-hidden="true" className="invisible col-start-1 row-start-1">
                {content.hero.words[1]}
              </span>
              {content.hero.words.map((word, index) => (
                <span
                  key={word}
                  aria-hidden="true"
                  className={`hero-word-cycle absolute left-0 top-0 ${index === 0 ? "hero-word-cycle--first" : ""}`}
                  style={{ animationDelay: `${index * 4}s` }}
                >
                  {word}
                </span>
              ))}
            </span>
          </h1>

          <p className="hero-reveal hero-reveal-3 mt-6 max-w-[570px] text-[15px] leading-7 text-white/75 sm:mt-7 sm:text-lg sm:leading-8">
            <span className="mb-1 block font-semibold text-white">{content.hero.strapline}</span>
            {content.hero.description}
          </p>

          <div className="hero-reveal hero-reveal-4 mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center sm:gap-4">
            <a
              href="#projects"
              className="group inline-flex min-h-14 items-center justify-center gap-5 rounded-full bg-primary px-7 text-sm font-bold text-[#07101a] transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:px-8"
            >
              Explore Our Work
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 transition-transform group-hover:translate-x-1">
                <path d="M3 10h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
            </a>
            <a
              href={`mailto:${content.email}`}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-white/40 bg-[#07101a]/25 px-7 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:px-8"
            >
              <span>Get In Touch</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
                <rect x="2.5" y="4" width="15" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="m3.5 5 6.5 5 6.5-5" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </a>
          </div>
        </div>

        <div className="hero-reveal hero-reveal-4 mb-5 flex flex-col gap-5 border-t border-white/20 py-5 sm:mb-7 sm:flex-row sm:items-center sm:justify-between sm:py-6">
          <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-6 lg:gap-8">
            {brandValues.map((value, index) => (
              <div key={value.label} className="flex min-w-0 items-center gap-2 sm:gap-3">
                <ValueIcon name={value.icon} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-white/60 sm:text-[10px]">
                    0{index + 1}
                  </span>
                  <span className="text-[9px] font-bold tracking-[0.1em] text-white sm:text-[11px] sm:tracking-[0.17em]">
                    {value.label}
                  </span>
                </div>
                {index < brandValues.length - 1 && (
                  <span aria-hidden="true" className="ml-1 h-9 w-px bg-primary/50 sm:ml-3 sm:h-12" />
                )}
              </div>
            ))}
          </div>

          <p className="flex items-center gap-2 text-[9px] font-medium tracking-[0.12em] text-white/60 sm:text-[10px] sm:tracking-[0.17em]">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-[18px] shrink-0 text-primary">
              <path d="M10 18s6-5.7 6-10a6 6 0 1 0-12 0c0 4.3 6 10 6 10Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="10" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>{content.locationLine.split(" · ").map((part, index) => <span key={part}>{index > 0 && <span className="text-primary"> · </span>}{part}</span>)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
