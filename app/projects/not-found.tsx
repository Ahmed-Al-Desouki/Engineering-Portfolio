import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0b1118] px-6 text-center">
      <div>
        <p className="font-mono text-sm text-primary">VA / 404</p>
        <h1 className="mt-4 text-3xl font-black uppercase text-white">Project not found</h1>
        <Link href="/projects" className="mt-7 inline-flex rounded-full border border-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary hover:text-[#07101a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          Back to all projects
        </Link>
      </div>
    </main>
  );
}
