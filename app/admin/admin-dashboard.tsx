"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { projectMediaLimits, validateProjectMediaFiles } from "@/lib/projects";
import { deleteProject, saveProject, saveSiteContent, signOut } from "@/app/admin/actions";

type ProjectRow = { slug: string; title: string; summary: string; data: Record<string, unknown>; is_published: boolean; is_featured: boolean; sort_order: number; is_starter?: boolean };
type MediaItem = { assetId: string; projectSlug: string; publicId: string; size: number; mimeType: string; url: string; resourceType: string; format: string };
type CloudinarySignature = { cloudName: string; apiKey: string; timestamp: number; folder: string; publicId: string; resourceType: "image" | "video"; signature: string };
type CloudinaryUploadResult = { asset_id: string; public_id: string; asset_folder: string; secure_url: string; resource_type: "image" | "video"; bytes: number; format: string; version: number; signature: string };
type Props = { content: Record<string, unknown>; projects: ProjectRow[]; email: string };
type Panel = "overview" | "content" | "projects" | "media";

const button = "inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 px-4 text-sm font-semibold text-white/85 transition hover:border-[#f5a623]/60 hover:text-[#f5a623] disabled:opacity-50";
const input = "mt-2 min-h-11 w-full rounded-lg border border-white/15 bg-[#0b131e] px-3 text-sm text-white outline-none focus:border-[#f5a623]";

function uploadToCloudinary(file: File, signed: CloudinarySignature, onProgress: (loaded: number) => void) {
  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const form = new FormData();
    form.set("file", file);
    form.set("api_key", signed.apiKey);
    form.set("timestamp", String(signed.timestamp));
    form.set("signature", signed.signature);
    form.set("folder", signed.folder);
    form.set("public_id", signed.publicId);
    const request = new XMLHttpRequest();
    request.open("POST", `https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`);
    request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(event.loaded); };
    request.onerror = () => reject(new Error(`Network error while uploading ${file.name}.`));
    request.onload = () => {
      const result = JSON.parse(request.responseText) as CloudinaryUploadResult & { error?: { message?: string } };
      if (request.status < 200 || request.status >= 300) reject(new Error(result.error?.message ?? `Cloudinary upload failed for ${file.name}.`));
      else resolve(result);
    };
    request.send(form);
  });
}

export default function AdminDashboard({ content, projects, email }: Props) {
  const [panel, setPanel] = useState<Panel>("overview");
  const [contentText, setContentText] = useState(() => JSON.stringify(content, null, 2));
  const [projectRows, setProjectRows] = useState(projects);
  const [projectText, setProjectText] = useState("");
  const [editingSlug, setEditingSlug] = useState("");
  const [message, setMessage] = useState("");
  const [busy, startTransition] = useTransition();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaSlug, setMediaSlug] = useState("site");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const mediaCheck = useMemo(() => validateProjectMediaFiles(files), [files]);
  const projectDraft = useMemo(() => {
    try { return JSON.parse(projectText) as Record<string, unknown>; }
    catch { return {}; }
  }, [projectText]);

  function updateProjectDraft(key: string, value: unknown) {
    setProjectText(JSON.stringify({ ...projectDraft, [key]: value }, null, 2));
  }

  function updateCover(key: "src" | "alt", value: string) {
    const cover = projectDraft.cover && typeof projectDraft.cover === "object"
      ? projectDraft.cover as Record<string, unknown>
      : { type: "image", src: "", alt: "" };
    updateProjectDraft("cover", { ...cover, [key]: value });
  }

  async function loadMedia() {
    if (!mediaSlug) return;
    setLoadingMedia(true);
    try {
      const response = await fetch(`/api/admin/media?projectSlug=${encodeURIComponent(mediaSlug)}`);
      const result = await response.json() as { items?: MediaItem[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not load media.");
      setMediaItems(result.items ?? []);
      setMessage(`${result.items?.length ?? 0} media file${result.items?.length === 1 ? "" : "s"} in “${mediaSlug}”.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load media."); }
    finally { setLoadingMedia(false); }
  }

  async function removeMedia(item: MediaItem) {
    if (!window.confirm(`Delete ${item.publicId}? Projects using this file will no longer display it.`)) return;
    try {
      const response = await fetch("/api/admin/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectSlug: mediaSlug, assetId: item.assetId }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not delete media.");
      setMediaItems((items) => items.filter((current) => current.assetId !== item.assetId));
      setMessage("Media file deleted.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not delete media."); }
  }

  function run(action: () => Promise<void>, success: string) {
    setMessage("");
    startTransition(async () => {
      try { await action(); setMessage(success); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Something went wrong."); }
    });
  }

  function editProject(row?: ProjectRow) {
    const data = row?.data ?? {
      slug: "new-project", title: "", category: "", summary: "", overview: "", year: "", location: "",
      challenge: "", solution: "", outcome: "", systems: [], cover: { type: "image", src: "", alt: "" }, gallery: [],
      isPublished: false, isFeatured: false, sortOrder: projectRows.length,
    };
    setEditingSlug(row?.slug ?? ""); setProjectText(JSON.stringify(data, null, 2)); setPanel("projects"); setMessage("");
  }

  async function uploadFiles() {
    if (!files.length || !mediaCheck.valid || !mediaSlug) return;
    setUploading(true); setMessage("");
    try {
      const totalBytes = files.reduce((total, file) => total + file.size, 0);
      let completedBytes = 0;
      const uploadedItems: MediaItem[] = [];
      for (const file of files) {
        const signResponse = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sign", projectSlug: mediaSlug, fileName: file.name, mimeType: file.type, bytes: file.size }) });
        const signResult = await signResponse.json() as CloudinarySignature & { error?: string };
        if (!signResponse.ok) throw new Error(signResult.error ?? "Could not authorize this upload.");
        const uploaded = await uploadToCloudinary(file, signResult, (loaded) => setUploadProgress(Math.round(((completedBytes + loaded) / totalBytes) * 100)));
        const registerResponse = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "register", projectSlug: mediaSlug, assetId: uploaded.asset_id, publicId: uploaded.public_id, folder: signResult.folder, resourceType: uploaded.resource_type, bytes: uploaded.bytes, version: uploaded.version, signature: uploaded.signature }) });
        const registerResult = await registerResponse.json() as { item?: MediaItem; error?: string };
        if (!registerResponse.ok || !registerResult.item) throw new Error(registerResult.error ?? "Could not save the uploaded asset details.");
        uploadedItems.push(registerResult.item);
        completedBytes += file.size;
        setMediaItems((items) => [registerResult.item!, ...items]);
        setUploadProgress(Math.round((completedBytes / totalBytes) * 100));
      }
      setUploadedUrls((current) => [...uploadedItems.map((item) => item.url), ...current]); setFiles([]); setMessage(`${uploadedItems.length} file${uploadedItems.length === 1 ? "" : "s"} uploaded to Cloudinary. Copy its URL into the relevant content or project media data.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(false); setUploadProgress(0); }
  }

  const nav: { id: Panel; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "◫" }, { id: "content", label: "Site content", icon: "▤" },
    { id: "projects", label: "Projects", icon: "▧" }, { id: "media", label: "Media library", icon: "▣" },
  ];

  return (
    <main className="min-h-screen bg-[#080f18] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-white/10 bg-[#0c1520] p-5 lg:border-b-0 lg:border-r lg:p-6">
          <Link href="/" className="text-sm font-black tracking-wide">VALEX<span className="text-[#f5a623]">.</span><span className="ml-2 text-[10px] font-semibold tracking-[.22em] text-white/45">ADMIN</span></Link>
          <p className="mt-2 truncate text-xs text-white/40">{email}</p>
          <nav aria-label="Admin navigation" className="mt-7 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {nav.map((item) => <button key={item.id} onClick={() => setPanel(item.id)} aria-current={panel === item.id ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm transition ${panel === item.id ? "bg-[#f5a623]/12 font-semibold text-[#ffc05c]" : "text-white/60 hover:bg-white/5 hover:text-white"}`}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
          </nav>
          <div className="mt-auto hidden pt-8 lg:block"><form action={signOut}><button className={button + " w-full"}>Sign out</button></form></div>
        </aside>

        <section className="min-w-0 px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#f5a623]">Website management</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">{nav.find((item) => item.id === panel)?.label}</h1></div>
            <Link href="/" className={button}>View website ↗</Link>
          </header>

          {message && <p role="status" className="mt-5 rounded-lg border border-[#f5a623]/30 bg-[#f5a623]/10 px-4 py-3 text-sm text-[#ffe0aa]">{message}</p>}

          {panel === "overview" && <div className="mt-7">
            <p className="max-w-2xl text-sm leading-6 text-white/60">Manage the VALEX site copy, project stories, and the media attached to them from one place.</p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[{ title: "Published projects", value: projectRows.filter((item) => item.is_published).length, detail: "Visible in the public portfolio" }, { title: "Draft projects", value: projectRows.filter((item) => !item.is_published && !item.is_starter).length, detail: "Saved for later editing" }, { title: "Site sections", value: Object.keys(content).length, detail: "Editable from Site content" }].map((card) => <div key={card.title} className="rounded-xl border border-white/10 bg-[#101a26] p-5"><p className="text-sm text-white/50">{card.title}</p><p className="mt-3 text-3xl font-bold">{card.value}</p><p className="mt-2 text-xs text-white/40">{card.detail}</p></div>)}
            </div>
            <div className="mt-6 rounded-xl border border-white/10 bg-[#101a26] p-5"><h2 className="font-semibold">Content safety</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">Copy and project records save to Supabase; original photos and videos live in Cloudinary. Projects remain drafts until explicitly published. Media is limited to 10 MB per image, 30 MB per video, and 100 MB total per folder.</p></div>
          </div>}

          {panel === "content" && <div className="mt-6 max-w-5xl">
            <p className="text-sm leading-6 text-white/55">Every section&apos;s text, services, engineers, process steps, and the home comparison are editable here. Preserve the JSON shape and edit copy or lists. Save only valid JSON.</p>
            <label className="mt-5 block text-xs font-semibold text-white/60" htmlFor="site-content-json">Site content JSON</label>
            <textarea id="site-content-json" value={contentText} onChange={(event) => setContentText(event.target.value)} spellCheck={false} className="mt-2 min-h-[60vh] w-full rounded-xl border border-white/10 bg-[#0b131e] p-4 font-mono text-xs leading-6 text-[#d7e0e9] outline-none focus:border-[#f5a623]/60" />
            <div className="mt-4 flex flex-wrap items-center gap-3"><button disabled={busy} className="min-h-11 rounded-lg bg-[#f5a623] px-5 text-sm font-bold text-[#08111c] disabled:opacity-50" onClick={() => run(() => saveSiteContent(contentText), "Site content saved.")}>{busy ? "Saving…" : "Save site content"}</button><button className={button} onClick={() => setContentText(JSON.stringify(content, null, 2))}>Reset editor</button></div>
          </div>}

          {panel === "projects" && <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-white/55">Create and edit project stories. A project is public only when <code className="text-[#ffc05c]">isPublished</code> is true.</p><button className="min-h-10 rounded-lg bg-[#f5a623] px-4 text-sm font-bold text-[#08111c]" onClick={() => editProject()}>＋ New project</button></div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {projectRows.map((row) => <article key={row.slug} className="rounded-xl border border-white/10 bg-[#101a26] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold">{row.title}</h2><p className="mt-1 truncate text-xs text-white/40">/{row.slug}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${row.is_published ? "bg-emerald-400/10 text-emerald-300" : "bg-white/10 text-white/55"}`}>{row.is_starter ? "Unsaved preview" : row.is_published ? "Published" : "Draft"}</span></div><p className="mt-3 line-clamp-2 text-xs leading-5 text-white/50">{row.summary || "No summary yet."}</p><div className="mt-4 flex gap-2"><button className={button} onClick={() => editProject(row)}>{row.is_starter ? "Use as draft" : "Edit"}</button>{!row.is_starter && <button className={button} onClick={() => { if (window.confirm(`Delete “${row.title}”? This cannot be undone.`)) run(async () => { await deleteProject(row.slug); setProjectRows((items) => items.filter((item) => item.slug !== row.slug)); }, "Project deleted."); }}>Delete</button>}</div></article>)}
              {!projectRows.length && <p className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-white/50">No database projects yet. Add your first project to begin.</p>}
            </div>
            {projectText && <div className="mt-8 max-w-5xl rounded-xl border border-white/10 bg-[#101a26] p-4 sm:p-6">
              <div className="flex justify-between gap-3"><div><h2 className="font-semibold">{editingSlug ? `Edit ${editingSlug}` : "New project details"}</h2><p className="mt-1 text-xs text-white/45">Add the project story, then attach its images, video, or optional before/after comparison.</p></div><button className="text-sm text-white/50 hover:text-white" onClick={() => setProjectText("")}>Close</button></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[ ["title", "Project title"], ["slug", "URL slug"], ["category", "Category"], ["year", "Year"], ["location", "Location"] ].map(([key, label]) => <label key={key} className="text-xs font-semibold text-white/60">{label}<input className={input} value={String(projectDraft[key] ?? "")} onChange={(event) => updateProjectDraft(key, event.target.value)} /></label>)}
                <label className="text-xs font-semibold text-white/60 sm:col-span-2">Short summary<textarea className={input + " min-h-20 py-3"} value={String(projectDraft.summary ?? "")} onChange={(event) => updateProjectDraft("summary", event.target.value)} /></label>
                <label className="text-xs font-semibold text-white/60 sm:col-span-2">Project overview<textarea className={input + " min-h-24 py-3"} value={String(projectDraft.overview ?? "")} onChange={(event) => updateProjectDraft("overview", event.target.value)} /></label>
                {[ ["challenge", "Challenge"], ["solution", "Solution"], ["outcome", "Outcome"] ].map(([key, label]) => <label key={key} className="text-xs font-semibold text-white/60">{label}<textarea className={input + " min-h-28 py-3"} value={String(projectDraft[key] ?? "")} onChange={(event) => updateProjectDraft(key, event.target.value)} /></label>)}
                <label className="text-xs font-semibold text-white/60 sm:col-span-2">Project systems, one per line<textarea className={input + " min-h-20 py-3"} value={Array.isArray(projectDraft.systems) ? projectDraft.systems.join("\n") : ""} onChange={(event) => updateProjectDraft("systems", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} /></label>
                <label className="text-xs font-semibold text-white/60 sm:col-span-2">Cover image URL<input className={input} value={String((projectDraft.cover as Record<string, unknown> | undefined)?.src ?? "")} onChange={(event) => updateCover("src", event.target.value)} placeholder="Paste an uploaded URL from Media library" /></label>
                <label className="text-xs font-semibold text-white/60 sm:col-span-2">Cover image description<input className={input} value={String((projectDraft.cover as Record<string, unknown> | undefined)?.alt ?? "")} onChange={(event) => updateCover("alt", event.target.value)} /></label>
                <div className="flex flex-wrap gap-5 text-sm text-white/75 sm:col-span-2"><label className="flex items-center gap-2"><input type="checkbox" checked={projectDraft.isPublished === true} onChange={(event) => updateProjectDraft("isPublished", event.target.checked)} /> Publish project</label><label className="flex items-center gap-2"><input type="checkbox" checked={projectDraft.isFeatured === true} onChange={(event) => updateProjectDraft("isFeatured", event.target.checked)} /> Feature on home</label></div>
              </div>
              <details className="mt-5 rounded-lg border border-white/10 p-4"><summary className="cursor-pointer text-sm font-semibold text-white/70">Advanced media and project data</summary><p className="mt-2 text-xs leading-5 text-white/45">Use this for gallery items, videos, and the optional before/after pair. Keep the same ProjectMedia structure shown in the starter example.</p><textarea aria-label="Advanced project JSON" value={projectText} onChange={(event) => setProjectText(event.target.value)} spellCheck={false} className="mt-3 min-h-64 w-full rounded-lg border border-white/10 bg-[#0b131e] p-4 font-mono text-xs leading-6 text-[#d7e0e9] outline-none focus:border-[#f5a623]/60" /></details>
              <div className="mt-4 flex flex-wrap gap-3"><button disabled={busy} className="min-h-11 rounded-lg bg-[#f5a623] px-5 text-sm font-bold text-[#08111c] disabled:opacity-50" onClick={() => run(async () => { await saveProject(projectText); const saved = JSON.parse(projectText) as Record<string, unknown>; const row: ProjectRow = { slug: String(saved.slug), title: String(saved.title), summary: String(saved.summary ?? ""), data: saved, is_published: saved.isPublished === true, is_featured: saved.isFeatured === true, sort_order: Number(saved.sortOrder ?? 0) }; setProjectRows((rows) => [...rows.filter((item) => item.slug !== row.slug && item.slug !== editingSlug), row].sort((a,b) => a.sort_order-b.sort_order)); setEditingSlug(row.slug); }, "Project saved.")}>Save project</button><button className={button} onClick={() => { setMediaSlug(String(projectDraft.slug ?? "")); setPanel("media"); }}>Upload project media</button></div>
            </div>}
          </div>}

          {panel === "media" && <div className="mt-6 max-w-4xl">
            <p className="text-sm leading-6 text-white/55">Upload image/video assets to the site&apos;s public media bucket. The dashboard validates file types, per-file limits, and selected batch size before upload.</p>
            <div className="mt-5 rounded-xl border border-white/10 bg-[#101a26] p-5 sm:p-7">
              <label className="block text-sm font-medium text-white/75">Content or project folder<input required className={input} value={mediaSlug} onChange={(event) => setMediaSlug(event.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())} placeholder="site or a project slug" /><span className="mt-1 block text-xs font-normal text-white/40">Use “site” for general website images; use the project URL slug for project assets.</span></label>
              <label className="mt-5 block text-sm font-medium text-white/75">Select images and videos<input className="mt-2 block w-full text-sm text-white/60 file:mr-4 file:min-h-10 file:rounded-lg file:border-0 file:bg-[#f5a623] file:px-4 file:font-bold file:text-[#08111c]" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))}/></label>
              <p className="mt-3 text-xs text-white/45">Images up to {projectMediaLimits.imageBytes / 1024 / 1024} MB each · videos up to {projectMediaLimits.videoBytes / 1024 / 1024} MB each · 100 MB total for each content/project folder</p>
              {files.length > 0 && <div className="mt-4 rounded-lg bg-black/20 p-3"><p className="text-xs text-white/60">{files.length} selected · {(mediaCheck.totalBytes / 1024 / 1024).toFixed(1)} MB</p>{mediaCheck.errors.map((error) => <p key={error} className="mt-2 text-xs text-red-300">{error}</p>)}</div>}
              {uploading && <div className="mt-4" role="status" aria-live="polite"><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#f5a623] transition-[width]" style={{ width: `${uploadProgress}%` }} /></div><p className="mt-2 text-xs text-white/50">Uploading to Cloudinary · {uploadProgress}%</p></div>}
              <button disabled={!files.length || !mediaCheck.valid || !mediaSlug || uploading} onClick={uploadFiles} className="mt-5 min-h-11 rounded-lg bg-[#f5a623] px-5 text-sm font-bold text-[#08111c] disabled:cursor-not-allowed disabled:opacity-40">{uploading ? "Uploading…" : "Upload selected media"}</button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Media in this folder</h2><p className="mt-1 text-xs text-white/45">Remove obsolete files here to free the project&apos;s 100 MB allowance.</p></div><button disabled={!mediaSlug || loadingMedia} className={button} onClick={loadMedia}>{loadingMedia ? "Loading…" : "Refresh media"}</button></div>
            {mediaItems.length > 0 ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{mediaItems.map((item) => <article key={item.assetId} className="overflow-hidden rounded-xl border border-white/10 bg-[#101a26]">
              <div className="relative aspect-video bg-[#0b131e]">{item.resourceType === "image" ? <Image src={item.url} alt={item.publicId} fill unoptimized sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /> : <div className="grid size-full place-items-center text-xs font-bold uppercase tracking-widest text-[#ffc05c]">Video</div>}</div>
              <div className="p-3"><p className="truncate text-xs font-semibold text-white/75" title={item.publicId}>{item.publicId}</p><p className="mt-1 text-[10px] text-white/40">{(item.size / 1024 / 1024).toFixed(1)} MB · {item.mimeType || "Media"}</p><div className="mt-3 flex gap-2"><button className={button} onClick={() => navigator.clipboard.writeText(item.url)}>Copy URL</button><button className={button} onClick={() => removeMedia(item)}>Delete</button></div></div>
            </article>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-white/15 p-5 text-sm text-white/45">No media loaded for this folder yet.</p>}
            {uploadedUrls.length > 0 && <div className="mt-5 rounded-xl border border-white/10 bg-[#101a26] p-5"><h2 className="font-semibold">Recently uploaded URLs</h2><p className="mt-1 text-xs text-white/45">Copy a URL into the relevant media <code>src</code> in Site content or project data.</p><ul className="mt-4 space-y-3">{uploadedUrls.map((url) => <li key={url} className="flex flex-wrap items-center gap-3"><code className="min-w-0 flex-1 break-all text-xs text-[#ffc05c]">{url}</code><button className={button} onClick={() => navigator.clipboard.writeText(url)}>Copy</button></li>)}</ul></div>}
          </div>}

          <div className="mt-10 border-t border-white/10 pt-4 lg:hidden"><form action={signOut}><button className={button}>Sign out</button></form></div>
        </section>
      </div>
    </main>
  );
}
