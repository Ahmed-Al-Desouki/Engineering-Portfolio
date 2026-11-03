import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/projects";

export default function ProjectCard({
  project,
  slot,
}: {
  project?: Project;
  slot: number;
}) {
  const href = project ? `/projects/${project.slug}` : "/projects";
  return (
    <Link
      href={href}
      aria-label={project ? `View project: ${project.title}` : `View project gallery`}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      <div className="relative aspect-[5/4] overflow-hidden border border-white/10 bg-[#101923]">
        {project?.cover.type === "image" ? (
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          />
        ) : project?.cover.type === "video" && project.cover.poster ? (
          <Image
            src={project.cover.poster}
            alt=""
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_25%,rgba(245,166,35,0.15),transparent_42%),linear-gradient(135deg,#182633,#0b1118_70%)]" />
        )}
        {!project && (
          <div className="absolute inset-5 flex flex-col items-center justify-center border border-white/10 text-center sm:inset-7">
            <span className="font-mono text-4xl font-semibold text-primary/70">{String(slot).padStart(2, "0")}</span>
            <span className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">Featured project slot</span>
          </div>
        )}
        {project?.cover.type === "video" && (
          <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-[#07101a]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Video
          </span>
        )}
        {project?.isPreview && (
          <span className="absolute left-4 top-4 rounded-full border border-primary/50 bg-[#07101a]/90 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
            Illustrative preview
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-4 border-b border-white/15 py-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {project ? project.category : `Project ${String(slot).padStart(2, "0")}`}
          </p>
          <h3 className="mt-2 text-lg font-bold uppercase tracking-tight text-white">
            {project?.title ?? "Project details coming soon"}
          </h3>
          {project && <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">{project.summary}</p>}
        </div>
        <span aria-hidden="true" className="mt-1 text-lg text-white/50 transition-transform group-hover:translate-x-1 group-hover:text-primary">→</span>
      </div>
    </Link>
  );
}
