export type ProjectImage = {
  type: "image";
  src: string;
  alt: string;
  assetId?: string;
};

export type ProjectVideo = {
  type: "video";
  src: string;
  title: string;
  poster?: string;
  assetId?: string;
};

export type ProjectMedia = ProjectImage | ProjectVideo;

export type Project = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  overview: string;
  isPreview?: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  cover: ProjectMedia;
  gallery: ProjectMedia[];
  year?: string;
  location?: string;
  challenge?: string;
  solution?: string;
  outcome?: string;
  systems?: string[];
  beforeAfter?: {
    before: ProjectImage;
    after: ProjectImage;
  };
};

// This clearly marked sample demonstrates the project page structure.
// Replace it with verified case studies before presenting it as client work.
export const projects: Project[] = [
  {
    slug: "plc-hmi-control-system-preview",
    title: "PLC & HMI Control System",
    category: "Control systems · Preview",
    isPreview: true,
    summary: "An illustrative case study showing how a control-system project can be presented. This is sample content, not a completed client project.",
    overview: "Illustrative concept for an automated production cell where machine sequencing, operator controls, and system status need to work together.",
    cover: {
      type: "image",
      src: "/images/valex-industrial-hero-background.jpg",
      alt: "Illustrative industrial control panel used to preview the project layout",
    },
    gallery: [],
    challenge: "Example brief: make machine sequence and operating states easier to understand from one operator station, including running, hold, and fault conditions.",
    solution: "Example approach: coordinate sequence logic in a PLC, present operating states and alarms through an HMI, and organize the control-panel signals for future SCADA visibility.",
    outcome: "Example outcome section: summarize verified commissioning results and measured improvements here. No project result or performance figure is claimed in this preview.",
    systems: [
      "PLC & HMI programming",
      "SCADA systems",
      "Electrical control panels",
      "Motion control & robotics",
    ],
  },
];

export const projectMediaLimits = {
  imageBytes: 10 * 1024 * 1024,
  videoBytes: 30 * 1024 * 1024,
  projectBytes: 100 * 1024 * 1024,
} as const;

const supportedMediaTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

// Shared policy for the future dashboard uploader. The upload API must repeat
// this validation on the server before saving any file.
export function validateProjectMediaFiles(files: readonly File[]) {
  const errors: string[] = [];
  const totalBytes = files.reduce((total, file) => total + file.size, 0);

  for (const file of files) {
    if (!supportedMediaTypes.has(file.type)) {
      errors.push(`${file.name}: choose a JPG, PNG, WebP, AVIF, MP4, WebM, or MOV file.`);
      continue;
    }

    const maxBytes = file.type.startsWith("video/")
      ? projectMediaLimits.videoBytes
      : projectMediaLimits.imageBytes;

    if (file.size > maxBytes) {
      const limitMb = Math.round(maxBytes / (1024 * 1024));
      errors.push(`${file.name}: the per-file limit is ${limitMb} MB.`);
    }
  }

  if (totalBytes > projectMediaLimits.projectBytes) {
    errors.push("All media for one project must stay within 100 MB total.");
  }

  return { valid: errors.length === 0, errors, totalBytes };
}

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
