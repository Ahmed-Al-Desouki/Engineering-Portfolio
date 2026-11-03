"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProjectImage } from "@/lib/projects";

export default function BeforeAfterSlider({
  before,
  after,
  title = "Before & after",
  showTitle = true,
}: {
  before: ProjectImage;
  after: ProjectImage;
  title?: string;
  showTitle?: boolean;
}) {
  const [position, setPosition] = useState(50);

  return (
    <section aria-labelledby="before-after-heading" className="space-y-4">
      {showTitle && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Project comparison</p>
            <h2 id="before-after-heading" className="mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">{title}</h2>
          </div>
          <p className="text-xs text-white/50">Drag the divider or use the arrow keys</p>
        </div>
      )}

      <div className="relative aspect-[4/3] select-none overflow-hidden border border-white/10 bg-[#080d13] focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-primary sm:aspect-[16/9]">
        <Image src={after.src} alt={after.alt} fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <Image src={before.src} alt={before.alt} fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" />
        </div>

        <span className="absolute left-4 top-4 rounded-full bg-[#07101a]/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">Before</span>
        <span className="absolute right-4 top-4 rounded-full bg-[#07101a]/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">After</span>

        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)]" style={{ left: `${position}%` }}>
          <span className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-[#07101a]/85 text-sm text-white">↔</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label="Adjust before and after comparison"
          className="absolute inset-0 size-full cursor-ew-resize opacity-0"
        />
      </div>
    </section>
  );
}
