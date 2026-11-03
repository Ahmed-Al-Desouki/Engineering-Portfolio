"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProjectMedia } from "@/lib/projects";

export default function ProjectMediaGallery({
  title,
  media,
}: {
  title: string;
  media: ProjectMedia[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMedia = media[activeIndex];

  if (!activeMedia) return null;

  return (
    <section aria-label={`${title} media gallery`} className="space-y-4">
      <div className="relative aspect-[16/10] overflow-hidden border border-white/10 bg-[#080d13] sm:aspect-[16/9]">
        {activeMedia.type === "image" ? (
          <Image
            src={activeMedia.src}
            alt={activeMedia.alt}
            fill
            priority
            sizes="(min-width: 1024px) 70vw, 100vw"
            className="object-contain"
          />
        ) : (
          <video
            key={activeMedia.src}
            controls
            playsInline
            preload="metadata"
            poster={activeMedia.poster}
            aria-label={activeMedia.title}
            className="size-full object-contain"
          >
            <source src={activeMedia.src} />
            Your browser does not support video playback.
          </video>
        )}
        <span className="absolute bottom-4 right-4 rounded-full border border-white/15 bg-[#07101a]/85 px-3 py-1.5 font-mono text-xs text-white">
          {String(activeIndex + 1).padStart(2, "0")} / {String(media.length).padStart(2, "0")}
        </span>
      </div>

      {media.length > 1 && (
        <div aria-label="Choose project media" className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {media.map((item, index) => (
            <button
              key={`${item.type}-${item.src}`}
              type="button"
              aria-label={`Show ${item.type === "video" ? `video: ${item.title}` : `image: ${item.alt}`}`}
              aria-pressed={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-video overflow-hidden border bg-[#101923] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeIndex === index ? "border-primary" : "border-white/15 opacity-65 hover:opacity-100"}`}
            >
              {item.type === "image" ? (
                <Image src={item.src} alt="" fill sizes="(min-width: 640px) 20vw, 33vw" className="object-cover" />
              ) : item.poster ? (
                <Image src={item.poster} alt="" fill sizes="(min-width: 640px) 20vw, 33vw" className="object-cover" />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-[10px] font-bold uppercase tracking-widest text-white/70">Video</span>
              )}
              {item.type === "video" && (
                <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-xl text-white drop-shadow">▶</span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
