import type { ProjectImage } from "@/lib/projects";

export type ProcessStep = {
  title: string;
  description: string;
};

export const siteContent = {
  brand: "VALEX AUTOMATION",
  logoImage: "/images/valex-logo-reference.png",
  email: "valex.automation@outlook.com",
  location: "10th of Ramadan City, Sharkia, Egypt",
  locationLine: "10TH OF RAMADAN CITY · SHARKIA · EGYPT",
  hero: {
    backgroundImage: "/images/valex-industrial-hero-background.jpg",
    eyebrow: "Industrial Automation & Smart Systems",
    strapline: "Engineering Beyond Limits.",
    description: "Intelligent engineering. Smarter systems. A focused team driven by precision, technology, and a passion for innovation.",
    words: ["AUTOMATE.", "OPTIMIZE.", "INNOVATE."],
  },
  about: {
    title: "Industrial automation & smart systems.",
    description: "Intelligent engineering. Smarter systems. A focused team driven by precision, technology, and a passion for innovation.",
    image: { src: "", alt: "VALEX AUTOMATION team" },
  },
  services: {
    title: "Industrial automation services.",
    description: "Practical engineering disciplines for industrial control, monitoring, and machine systems.",
  },
  beforeAfter: {
    title: "A visual wiring comparison.",
    description: "Drag the divider to compare two industrial electrical cabinets.",
    note: "Illustrative stock photos of separate cabinets — not a real VALEX project transformation.",
  },
  projects: {
    title: "Selected work.",
    description: "A gallery space for verified project stories and imagery.",
  },
  process: {
    title: "A clear process, built around the work.",
    description: "A five-step outline to replace with VALEX’s confirmed project workflow.",
  },
  team: {
    title: "A focused team of two.",
    description: "Meet the two engineers behind VALEX AUTOMATION.",
  },
  contact: {
    title: "Let’s start a conversation.",
    description: "Let’s build a smarter industry together. Reach out to discuss your automation requirements.",
  },
  servicesList: [
    {
      title: "PLC & HMI programming",
      description: "PLC logic and operator screens for machine sequences, operating states, and alarms.",
    },
    {
      title: "SCADA systems",
      description: "Supervisory monitoring that brings process information and equipment status into view.",
    },
    {
      title: "Electrical control panels",
      description: "Control panels that organize automation components, protection, and field connections.",
    },
    {
      title: "Motion control & robotics",
      description: "Coordinated motion and robotics for industrial machinery and automated cells.",
    },
    {
      title: "Industrial solutions",
      description: "Automation concepts tailored to the requirements of an industrial application.",
    },
  ],
  engineers: [
    { name: "Eng. Abdelrahman Ashraf", phone: "+201128428609", image: { src: "", alt: "Portrait of Eng. Abdelrahman Ashraf" } },
    { name: "Eng. Abdelrahman Ibrahim", phone: "+201062904981", image: { src: "", alt: "Portrait of Eng. Abdelrahman Ibrahim" } },
  ],
} as const;

export const homeBeforeAfter = {
  before: {
    type: "image",
    src: "/images/control-panel-before.webp",
    alt: "Weathered older electrical control panel shown as an illustrative comparison image",
  },
  after: {
    type: "image",
    src: "/images/control-panel-after.webp",
    alt: "Wired electrical control panel interior shown as an illustrative comparison image",
  },
} satisfies { before: ProjectImage; after: ProjectImage };

// Draft copy: replace these five entries with VALEX's confirmed process.
export const processSteps: ProcessStep[] = [
  {
    title: "Understand the brief",
    description: "Clarify the operating needs, constraints, and desired outcome.",
  },
  {
    title: "Engineer the solution",
    description: "Shape a control and automation approach for the application.",
  },
  {
    title: "Build and integrate",
    description: "Bring the selected equipment and control systems together.",
  },
  {
    title: "Test and commission",
    description: "Check the system and confirm its operation on site.",
  },
  {
    title: "Handover and support",
    description: "Document the work and help the team move forward confidently.",
  },
];
