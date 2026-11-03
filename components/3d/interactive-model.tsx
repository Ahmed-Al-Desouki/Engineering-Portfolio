
"use client";

import dynamic from "next/dynamic";

const IndustrialScene = dynamic(
  () => import("./industrial-scene"),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-square w-full items-center justify-center">
        <span className="text-xs tracking-[0.3em] text-primary">
          INITIALIZING 3D ENGINE...
        </span>
      </div>
    ),
  }
);

export default function InteractiveModel() {
  return (
    <div className="relative aspect-square w-full max-w-[600px]">
      <IndustrialScene />
    </div>
  );
}
