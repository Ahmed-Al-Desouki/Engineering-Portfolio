"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { projectMediaLimits, validateProjectMediaFiles, type ProjectImage, type ProjectMedia } from "@/lib/projects";
import { deleteProject, saveProject, saveSiteContent, signOut } from "@/app/admin/actions";

type Dict = Record<string, unknown>;
type ProjectRow = { slug: string; title: string; summary: string; data: Dict; is_published: boolean; is_featured: boolean; sort_order: number; is_starter?: boolean };
type MediaItem = { assetId: string; projectSlug: string; publicId: string; size: number; mimeType: string; url: string; resourceType: "image" | "video"; format: string };
type UploadSignature = { cloudName: string; apiKey: string; timestamp: number; folder: string; publicId: string; resourceType: "image" | "video"; signature: string; existing?: MediaItem };
type UploadResult = { asset_id: string; public_id: string; asset_folder: string; secure_url: string; resource_type: "image" | "video"; bytes: number; format: string; version: number; signature: string };
type Props = { content: Dict; projects: ProjectRow[]; email: string };
type Panel = "overview" | "content" | "projects" | "media";
type MediaPicker = { folder: string; resourceType: "image" | "video" | "any"; items: MediaItem[]; onSelect: (item: MediaItem) => void };

const button = "inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 px-4 text-sm font-semibold text-white/85 transition hover:border-[#f5a623]/60 hover:text-[#f5a623] disabled:cursor-not-allowed disabled:opacity-50";
const primary = "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#f5a623] px-5 text-sm font-bold text-[#08111c] transition hover:bg-[#ffc05c] disabled:cursor-not-allowed disabled:opacity-50";
const input = "mt-2 min-h-11 w-full rounded-lg border border-white/15 bg-[#0b131e] px-3 text-sm text-white outline-none focus:border-[#f5a623]";
const textArea = input + " min-h-24 py-3";
const imageTypes = "image/jpeg,image/png,image/webp,image/avif";
const mediaTypes = `${imageTypes},video/mp4,video/webm,video/quicktime`;

function objectOf(value: unknown): Dict {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Dict : {};
}
function stringOf(value: unknown) { return typeof value === "string" ? value : ""; }
function arrayOf(value: unknown): Dict[] { return Array.isArray(value) ? value.map(objectOf) : []; }
function normalizeProjectSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uploadToCloudinary(file: File, signed: UploadSignature, onProgress: (loaded: number) => void) {
  return new Promise<UploadResult>((resolve, reject) => {
    const form = new FormData();
    form.set("file", file); form.set("api_key", signed.apiKey); form.set("timestamp", String(signed.timestamp));
    form.set("signature", signed.signature); form.set("folder", signed.folder); form.set("public_id", signed.publicId);
    const request = new XMLHttpRequest();
    request.open("POST", `https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`);
    request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(event.loaded); };
    request.onerror = () => reject(new Error(`Network error while uploading ${file.name}.`));
    request.onload = () => {
      let result: UploadResult & { error?: { message?: string } };
      try { result = JSON.parse(request.responseText) as UploadResult & { error?: { message?: string } }; }
      catch { reject(new Error(`Cloudinary returned an unreadable response for ${file.name} (HTTP ${request.status}).`)); return; }
      if (request.status < 200 || request.status >= 300) reject(new Error(result.error?.message ?? `Cloudinary upload failed for ${file.name} (HTTP ${request.status}).`));
      else resolve(result);
    };
    request.send(form);
  });
}

async function uploadOne(file: File, slug: string, onProgress: (loaded: number) => void): Promise<MediaItem> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const contentHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const signResponse = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sign", projectSlug: slug, fileName: file.name, mimeType: file.type, bytes: file.size, contentHash }) });
  const signature = await signResponse.json() as UploadSignature & { error?: string };
  if (!signResponse.ok) throw new Error(signature.error ?? "Could not authorize this upload.");
  if (signature.existing) return signature.existing;
  const uploaded = await uploadToCloudinary(file, signature, onProgress);
  const registerResponse = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "register", projectSlug: slug, assetId: uploaded.asset_id, publicId: uploaded.public_id, folder: signature.folder, resourceType: uploaded.resource_type, bytes: uploaded.bytes, version: uploaded.version, signature: uploaded.signature }) });
  const registered = await registerResponse.json() as { item?: MediaItem; error?: string };
  if (!registerResponse.ok || !registered.item) throw new Error(registered.error ?? "File uploaded, but its details could not be saved.");
  return registered.item;
}

function TextField({ label, value, onChange, multiline = false, hint, disabled = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; hint?: string; disabled?: boolean }) {
  return <label className="block text-xs font-semibold text-white/65">{label}{multiline ? <textarea disabled={disabled} className={textArea} value={value} onChange={(event) => onChange(event.target.value)} /> : <input disabled={disabled} className={input} value={value} onChange={(event) => onChange(event.target.value)} />}{hint && <span className="mt-1 block text-[11px] font-normal leading-5 text-white/40">{hint}</span>}</label>;
}

function ImageUploadField({ label, src, onUpload, onClear, onPickExisting, uploading = false, disabled = false, hint }: { label: string; src: string; onUpload: (file: File) => void; onClear: () => void; onPickExisting?: () => void; uploading?: boolean; disabled?: boolean; hint?: string }) {
  return <div className="block text-xs font-semibold text-white/65"><span>{label}</span><div className="mt-2 max-w-md">{src ? <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-[#0b131e]"><Image src={src} alt="" fill unoptimized sizes="(min-width: 768px) 30vw, 100vw" className="object-contain" /></div> : <div className="grid aspect-video place-items-center rounded-lg border border-dashed border-white/15 bg-[#0b131e] text-xs font-normal text-white/40">No image selected</div>}<div className="mt-2 flex flex-wrap gap-2"><label className={`${button} cursor-pointer ${disabled ? "pointer-events-none opacity-50" : ""}`}>{uploading ? "Uploading…" : src ? "Replace image" : "Choose image"}<input className="sr-only" type="file" accept={imageTypes} disabled={uploading || disabled} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ""; }} /></label>{onPickExisting && <button type="button" disabled={disabled || uploading} className={button} onClick={onPickExisting}>Choose existing</button>}{src && <button type="button" disabled={disabled} className={button} onClick={onClear}>Remove image</button>}</div>{hint && <span className="mt-1 block text-[11px] font-normal leading-5 text-white/40">{hint}</span>}</div></div>;
}

function MediaPreview({ item, label }: { item?: ProjectMedia | ProjectImage; label: string }) {
  const media = item as ProjectMedia | undefined;
  if (!media?.src) return <div className="grid aspect-video place-items-center rounded-lg border border-dashed border-white/15 bg-black/15 text-xs text-white/35">{label} preview</div>;
  return <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-black/25">{media.type === "image" ? <Image src={media.src} alt={media.alt} fill unoptimized sizes="(min-width: 768px) 30vw, 100vw" className="object-cover" /> : <video src={media.src} poster={media.poster} controls preload="metadata" className="size-full object-contain" />}</div>;
}

export default function AdminDashboard({ content, projects, email }: Props) {
  const [panel, setPanel] = useState<Panel>("overview");
  const [contentDraft, setContentDraft] = useState<Dict>(() => structuredClone(content));
  const [projectRows, setProjectRows] = useState(projects);
  const [projectDraft, setProjectDraft] = useState<Dict | null>(null);
  const [editingSlug, setEditingSlug] = useState("");
  const [lockedMediaSlug, setLockedMediaSlug] = useState("");
  const [message, setMessage] = useState("");
  const [busy, startTransition] = useTransition();
  const [mediaSlug, setMediaSlug] = useState("site");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [projectUploadProgress, setProjectUploadProgress] = useState(0);
  const [projectUploadBusy, setProjectUploadBusy] = useState(false);
  const [siteImageTarget, setSiteImageTarget] = useState("");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [previewUrl, setPreviewUrl] = useState("");
  const [mediaPicker, setMediaPicker] = useState<MediaPicker | null>(null);

  const mediaCheck = useMemo(() => validateProjectMediaFiles(mediaFiles), [mediaFiles]);
  const projectFolderOptions = useMemo(() => ["site", ...projectRows.filter((row) => !row.is_starter).map((row) => row.slug)], [projectRows]);
  const visibleMedia = mediaFilter === "all" ? mediaItems : mediaItems.filter((item) => item.projectSlug === mediaFilter);

  function setSectionField(section: string, key: string, value: unknown) {
    setContentDraft((current) => ({ ...current, [section]: { ...objectOf(current[section]), [key]: value } }));
  }
  function setContentField(key: string, value: unknown) { setContentDraft((current) => ({ ...current, [key]: value })); }
  function setListEntry(listKey: string, index: number, key: string, value: unknown) {
    const list = Array.isArray(contentDraft[listKey]) ? [...contentDraft[listKey] as Dict[]] : [];
    list[index] = { ...objectOf(list[index]), [key]: value };
    setContentDraft((current) => ({ ...current, [listKey]: list }));
  }
  function addListEntry(listKey: "servicesList" | "engineers" | "processSteps", value: Dict) {
    setContentDraft((current) => ({ ...current, [listKey]: [...arrayOf(current[listKey]), value] }));
  }
  function removeListEntry(listKey: "servicesList" | "engineers" | "processSteps", index: number) {
    setContentDraft((current) => ({ ...current, [listKey]: arrayOf(current[listKey]).filter((_, entryIndex) => entryIndex !== index) }));
  }

  function setProjectField(key: string, value: unknown) {
    setProjectDraft((current) => current ? { ...current, [key]: value } : current);
  }
  async function uploadSiteImage(file: File, target: string, apply: (url: string) => void) {
    if (!file.type.startsWith("image/")) { setMessage("Choose an image file for this field."); return; }
    const validation = validateProjectMediaFiles([file]);
    if (!validation.valid) { setMessage(validation.errors.join(" ")); return; }
    setSiteImageTarget(target); setMessage("");
    try {
      const asset = await uploadOne(file, "site", () => {});
      apply(asset.url);
      setMediaItems((items) => [asset, ...items.filter((item) => item.assetId !== asset.assetId)]);
      setMessage(`${file.name} is ready. If this exact file was uploaded through this dashboard before, its Cloudinary copy was reused. Save site content to apply it to the website.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Image upload failed."); }
    finally { setSiteImageTarget(""); }
  }
  async function openMediaPicker(folder: string, resourceType: MediaPicker["resourceType"], onSelect: (item: MediaItem) => void) {
    setLoadingMedia(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/media?projectSlug=${encodeURIComponent(folder)}`);
      const result = await response.json() as { items?: MediaItem[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not load saved media.");
      const items = result.items ?? [];
      setMediaItems((current) => [...current.filter((item) => item.projectSlug !== folder), ...items]);
      setMediaPicker({ folder, resourceType, items: items.filter((item) => resourceType === "any" || item.resourceType === resourceType), onSelect });
      if (!items.length) setMessage("No saved media in this folder yet.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load saved media."); }
    finally { setLoadingMedia(false); }
  }
  function setCoverField(key: string, value: unknown) {
    setProjectDraft((current) => current ? { ...current, cover: { ...objectOf(current.cover), [key]: value } } : current);
  }
  function setBeforeAfterField(side: "before" | "after", key: string, value: unknown) {
    setProjectDraft((current) => current ? { ...current, beforeAfter: { ...objectOf(current.beforeAfter), [side]: { ...objectOf(objectOf(current.beforeAfter)[side]), [key]: value } } } : current);
  }

  function editProject(row?: ProjectRow) {
    const data = row?.data ?? { slug: "new-project", title: "", category: "", summary: "", overview: "", year: "", location: "", challenge: "", solution: "", outcome: "", systems: [], cover: { type: "image", src: "", alt: "" }, gallery: [], isPublished: false, isFeatured: false, sortOrder: projectRows.length };
    setEditingSlug(row?.is_starter ? "" : row?.slug ?? "");
    setLockedMediaSlug("");
    setProjectDraft(structuredClone(data)); setPanel("projects"); setMessage("");
  }

  async function uploadProjectFiles(selectedFiles: FileList | null, target: "cover" | "gallery" | "before" | "after") {
    if (!projectDraft || !selectedFiles?.length) return;
    const slug = normalizeProjectSlug(stringOf(projectDraft.slug));
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { setMessage("Enter the project URL in lowercase English letters and separate words with hyphens before uploading media."); return; }
    if (target === "before" || target === "after") {
      const invalid = Array.from(selectedFiles).find((file) => !file.type.startsWith("image/"));
      if (invalid) { setMessage("Before and after comparisons only accept images."); return; }
    }
    const files = Array.from(selectedFiles);
    const localCheck = validateProjectMediaFiles(files);
    if (!localCheck.valid) { setMessage(localCheck.errors.join(" ")); return; }
    setProjectUploadBusy(true); setMessage(""); setProjectUploadProgress(0); setLockedMediaSlug(slug);
    let total = 0; const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    try {
      for (const file of files) {
        const asset = await uploadOne(file, slug, (loaded) => setProjectUploadProgress(Math.round(((total + loaded) / totalBytes) * 100)));
        const media: ProjectMedia = asset.resourceType === "image"
          ? { type: "image", src: asset.url, alt: file.name.replace(/\.[^.]+$/, ""), assetId: asset.assetId }
          : { type: "video", src: asset.url, title: file.name.replace(/\.[^.]+$/, ""), assetId: asset.assetId };
        setMediaItems((items) => [asset, ...items.filter((item) => item.assetId !== asset.assetId)]);
        setProjectDraft((current) => {
          if (!current) return current;
          if (target === "cover") return { ...current, cover: media };
          if (target === "before" || target === "after") return { ...current, beforeAfter: { ...objectOf(current.beforeAfter), [target]: { type: "image", src: asset.url, alt: file.name.replace(/\.[^.]+$/, ""), assetId: asset.assetId } } };
          return { ...current, gallery: [...(Array.isArray(current.gallery) ? current.gallery as ProjectMedia[] : []), media] };
        });
        total += file.size;
      }
      setMessage(`${files.length} ${files.length === 1 ? "file uploaded and attached" : "files uploaded and attached"}. Save the project to keep these changes.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "File upload failed."); }
    finally { setProjectUploadBusy(false); setProjectUploadProgress(0); }
  }

  function saveSite() {
    run(async () => saveSiteContent(contentDraft), "Website content saved.");
  }
  function saveProjectDraft() {
    if (!projectDraft) return;
    const systems = Array.isArray(projectDraft.systems)
      ? projectDraft.systems
      : stringOf(projectDraft.systems).split("\n").map((item) => item.trim()).filter(Boolean);
    const projectToSave: Dict = { ...projectDraft, slug: normalizeProjectSlug(stringOf(projectDraft.slug)), systems };
    run(async () => {
      await saveProject(projectToSave, editingSlug);
      setProjectDraft(projectToSave);
      const row: ProjectRow = { slug: stringOf(projectToSave.slug), title: stringOf(projectToSave.title), summary: stringOf(projectToSave.summary), data: projectToSave, is_published: projectToSave.isPublished === true, is_featured: projectToSave.isFeatured === true, sort_order: Number(projectToSave.sortOrder ?? 0) };
      setProjectRows((rows) => [...rows.filter((item) => item.slug !== row.slug && item.slug !== editingSlug), row].sort((a, b) => a.sort_order - b.sort_order));
      setEditingSlug(row.slug); setLockedMediaSlug(row.slug);
    }, "Project saved. Review its details before publishing.");
  }
  function run(action: () => Promise<void>, success: string) {
    setMessage("");
    startTransition(async () => {
      try { await action(); setMessage(success); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Something went wrong."); }
    });
  }

  async function loadMedia(slug = mediaSlug) {
    if (!slug) return;
    setLoadingMedia(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/media?projectSlug=${encodeURIComponent(slug)}`);
      const result = await response.json() as { items?: MediaItem[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not load media.");
      setMediaItems((items) => [...items.filter((item) => item.projectSlug !== slug), ...(result.items ?? [])]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load media."); }
    finally { setLoadingMedia(false); }
  }
  async function loadAllMedia() {
    setLoadingMedia(true); setMessage("");
    try {
      const results = await Promise.all(projectFolderOptions.map(async (slug) => {
        const response = await fetch(`/api/admin/media?projectSlug=${encodeURIComponent(slug)}`);
        const result = await response.json() as { items?: MediaItem[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? `Could not load media for ${slug}.`);
        return result.items ?? [];
      }));
      setMediaItems(results.flat());
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load media."); }
    finally { setLoadingMedia(false); }
  }
  async function uploadLibraryFiles() {
    if (!mediaFiles.length || !mediaCheck.valid || uploading) return;
    setUploading(true); setMessage("");
    try {
      let done = 0; const total = mediaFiles.reduce((sum, file) => sum + file.size, 0);
      for (const file of mediaFiles) {
        const asset = await uploadOne(file, mediaSlug, (loaded) => setUploadProgress(Math.round(((done + loaded) / total) * 100)));
        setMediaItems((items) => [asset, ...items.filter((item) => item.assetId !== asset.assetId)]); done += file.size;
      }
      setMediaFiles([]); setMessage(`${mediaFiles.length} file(s) uploaded to the ${mediaSlug} folder.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "File upload failed."); }
    finally { setUploading(false); setUploadProgress(0); }
  }
  async function removeMedia(item: MediaItem) {
    if (!window.confirm(`Permanently delete ${item.publicId}? Any page using it will stop displaying it.`)) return;
    try {
      const response = await fetch("/api/admin/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectSlug: item.projectSlug, assetId: item.assetId }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not delete the file.");
      setMediaItems((items) => items.filter((entry) => entry.assetId !== item.assetId));
      setMessage("File deleted from Cloudinary and the media registry.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not delete the file."); }
  }
  function removeProjectGallery(index: number) {
    if (!projectDraft) return;
    const gallery = Array.isArray(projectDraft.gallery) ? [...projectDraft.gallery as ProjectMedia[]] : [];
    gallery.splice(index, 1); setProjectField("gallery", gallery);
  }

  const nav: { id: Panel; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "◫" }, { id: "content", label: "Website content", icon: "▤" },
    { id: "projects", label: "Projects", icon: "▧" }, { id: "media", label: "Media library", icon: "▣" },
  ];
  const servicesList = arrayOf(contentDraft.servicesList);
  const engineers = arrayOf(contentDraft.engineers);
  const processSteps = arrayOf(contentDraft.processSteps);
  const values = objectOf(contentDraft.hero);

  return (
    <main className="min-h-screen bg-[#080f18] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-white/10 bg-[#0c1520] p-5 lg:border-b-0 lg:border-r lg:p-6">
          <Link href="/" className="text-sm font-black tracking-wide">VALEX<span className="text-[#f5a623]">.</span><span className="ml-2 text-[10px] font-semibold tracking-[.22em] text-white/45">ADMIN</span></Link>
          <p className="mt-2 truncate text-xs text-white/40">{email}</p>
          <nav aria-label="Admin navigation" className="mt-7 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {nav.map((item) => <button key={item.id} onClick={() => { setPanel(item.id); setMessage(""); if (item.id === "media") void loadAllMedia(); }} aria-current={panel === item.id ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm transition ${panel === item.id ? "bg-[#f5a623]/12 font-semibold text-[#ffc05c]" : "text-white/60 hover:bg-white/5 hover:text-white"}`}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
          </nav>
          <div className="mt-auto hidden pt-8 lg:block"><form action={signOut}><button className={button + " w-full"}>Sign out</button></form></div>
        </aside>

        <section className="min-w-0 px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#f5a623]">Website management</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">{nav.find((item) => item.id === panel)?.label}</h1></div>
            <Link href="/" className={button}>View website ↗</Link>
          </header>
          {message && <p role="status" aria-live="polite" className="mt-5 rounded-lg border border-[#f5a623]/30 bg-[#f5a623]/10 px-4 py-3 text-sm leading-6 text-[#ffe0aa]">{message}</p>}

          {panel === "overview" && <div className="mt-7">
            <p className="max-w-2xl text-sm leading-6 text-white/60">Manage VALEX website copy, project stories, and the media attached to them from one place.</p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[{ title: "Published projects", value: projectRows.filter((item) => item.is_published).length, detail: "Visible in the public portfolio" }, { title: "Draft projects", value: projectRows.filter((item) => !item.is_published && !item.is_starter).length, detail: "Saved and ready to edit" }, { title: "Website sections", value: Object.keys(contentDraft).length, detail: "Editable from Website content" }].map((card) => <div key={card.title} className="rounded-xl border border-white/10 bg-[#101a26] p-5"><p className="text-sm text-white/50">{card.title}</p><p className="mt-3 text-3xl font-bold">{card.value}</p><p className="mt-2 text-xs text-white/40">{card.detail}</p></div>)}
            </div>
            <div className="mt-6 rounded-xl border border-white/10 bg-[#101a26] p-5"><h2 className="font-semibold">Media uploads</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">Upload project images and videos directly in the project form. Images are limited to 10 MB, videos to 30 MB, and each project to 100 MB total.</p><button className={primary + " mt-4"} onClick={() => editProject()}>＋ New project</button></div>
          </div>}

          {panel === "content" && <div className="mt-6 max-w-5xl space-y-6">
            <p className="text-sm leading-6 text-white/55">Edit copy in clear fields and add or remove services, engineers, and process steps. Upload images directly here—no image URLs or code editing needed.</p>
            <div className="rounded-xl border border-white/10 bg-[#101a26] p-5 sm:p-6"><h2 className="text-lg font-bold">Brand and contact</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
              {([["brand", "Brand name"], ["email", "Contact email"], ["location", "Location"], ["locationLine", "Short location line"]] as const).map(([key, label]) => <TextField key={key} label={label} value={stringOf(contentDraft[key])} onChange={(value) => setContentField(key, value)} />)}
              <ImageUploadField label="Brand logo" src={stringOf(contentDraft.logoImage)} uploading={siteImageTarget === "logo"} onUpload={(file) => void uploadSiteImage(file, "logo", (url) => setContentField("logoImage", url))} onPickExisting={() => void openMediaPicker("site", "image", (item) => setContentField("logoImage", item.url))} onClear={() => setContentField("logoImage", "")} />
            </div></div>
            <div className="rounded-xl border border-white/10 bg-[#101a26] p-5 sm:p-6"><h2 className="text-lg font-bold">Home hero</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><TextField label="Eyebrow" value={stringOf(values.eyebrow)} onChange={(value) => setSectionField("hero", "eyebrow", value)} /><TextField label="Headline" value={stringOf(values.strapline)} onChange={(value) => setSectionField("hero", "strapline", value)} /><TextField label="Description" multiline value={stringOf(values.description)} onChange={(value) => setSectionField("hero", "description", value)} /><ImageUploadField label="Hero background image" src={stringOf(values.backgroundImage)} uploading={siteImageTarget === "hero-background"} onUpload={(file) => void uploadSiteImage(file, "hero-background", (url) => setSectionField("hero", "backgroundImage", url))} onPickExisting={() => void openMediaPicker("site", "image", (item) => setSectionField("hero", "backgroundImage", item.url))} onClear={() => setSectionField("hero", "backgroundImage", "")} /><TextField label="Animated words (separate with commas)" value={Array.isArray(values.words) ? values.words.join(", ") : ""} onChange={(value) => setSectionField("hero", "words", value.split(",").map((word) => word.trim()).filter(Boolean))} /></div></div>
            {([ ["about", "About"], ["services", "Services"], ["beforeAfter", "Before and after"], ["projects", "Projects"], ["process", "Process"], ["team", "Team"], ["contact", "Contact"] ] as const).map(([section, label]) => {
              const data = objectOf(contentDraft[section]);
              return <div key={section} className="rounded-xl border border-white/10 bg-[#101a26] p-5 sm:p-6"><h2 className="text-lg font-bold">{label}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><TextField label="Title" value={stringOf(data.title)} onChange={(value) => setSectionField(section, "title", value)} /><TextField label="Description" multiline value={stringOf(data.description)} onChange={(value) => setSectionField(section, "description", value)} />{section === "beforeAfter" && <TextField label="Note" multiline value={stringOf(data.note)} onChange={(value) => setSectionField(section, "note", value)} />}{section === "about" && <><ImageUploadField label="About section image" src={stringOf(objectOf(data.image).src)} uploading={siteImageTarget === "about-image"} onUpload={(file) => void uploadSiteImage(file, "about-image", (url) => setSectionField("about", "image", { ...objectOf(data.image), src: url }))} onPickExisting={() => void openMediaPicker("site", "image", (item) => setSectionField("about", "image", { ...objectOf(data.image), src: item.url }))} onClear={() => setSectionField("about", "image", { ...objectOf(data.image), src: "" })} /><TextField label="Image description" value={stringOf(objectOf(data.image).alt)} onChange={(value) => setSectionField("about", "image", { ...objectOf(data.image), alt: value })} /></>}</div></div>;
            })}
            <div className="rounded-xl border border-white/10 bg-[#101a26] p-5 sm:p-6"><h2 className="text-lg font-bold">Home page before and after</h2><p className="mt-1 text-xs text-white/45">Choose each image from your device. Uploaded images are saved to Cloudinary and linked to the site content.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{(["before", "after"] as const).map((side) => { const comparison = objectOf(objectOf(contentDraft.homeBeforeAfter)[side]); const target = `home-${side}`; return <div key={side} className="space-y-3"><ImageUploadField label={side === "before" ? "Before image" : "After image"} src={stringOf(comparison.src)} uploading={siteImageTarget === target} onUpload={(file) => void uploadSiteImage(file, target, (url) => setContentField("homeBeforeAfter", { ...objectOf(contentDraft.homeBeforeAfter), [side]: { ...comparison, src: url } }))} onPickExisting={() => void openMediaPicker("site", "image", (item) => setContentField("homeBeforeAfter", { ...objectOf(contentDraft.homeBeforeAfter), [side]: { ...comparison, src: item.url } }))} onClear={() => setContentField("homeBeforeAfter", { ...objectOf(contentDraft.homeBeforeAfter), [side]: { ...comparison, src: "" } })} /><TextField label="Image description" value={stringOf(comparison.alt)} onChange={(value) => setContentField("homeBeforeAfter", { ...objectOf(contentDraft.homeBeforeAfter), [side]: { ...comparison, alt: value } })} /></div>; })}</div></div>
            <div className="rounded-xl border border-white/10 bg-[#101a26] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Services</h2><p className="mt-1 text-xs text-white/45">Each service has a name and a short description.</p></div><button className={button} onClick={() => addListEntry("servicesList", { title: "", description: "" })}>＋ Add service</button></div><div className="mt-4 space-y-3">{servicesList.map((service, index) => <div key={index} className="grid gap-3 rounded-lg border border-white/10 p-4 sm:grid-cols-[1fr_1.5fr_auto]"><TextField label="Service name" value={stringOf(service.title)} onChange={(value) => setListEntry("servicesList", index, "title", value)} /><TextField label="Service description" value={stringOf(service.description)} onChange={(value) => setListEntry("servicesList", index, "description", value)} /><button className={button + " self-end"} onClick={() => removeListEntry("servicesList", index)}>Remove</button></div>)}</div></div>
            <div className="rounded-xl border border-white/10 bg-[#101a26] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Engineers</h2><button className={button} onClick={() => addListEntry("engineers", { name: "", phone: "", image: { src: "", alt: "" } })}>＋ Add engineer</button></div><div className="mt-4 space-y-3">{engineers.map((engineer, index) => <div key={index} className="grid gap-3 rounded-lg border border-white/10 p-4 sm:grid-cols-2"><TextField label="Name" value={stringOf(engineer.name)} onChange={(value) => setListEntry("engineers", index, "name", value)} /><TextField label="Phone number" value={stringOf(engineer.phone)} onChange={(value) => setListEntry("engineers", index, "phone", value)} /><ImageUploadField label="Engineer photo" src={stringOf(objectOf(engineer.image).src)} uploading={siteImageTarget === `engineer-${index}`} onUpload={(file) => void uploadSiteImage(file, `engineer-${index}`, (url) => setListEntry("engineers", index, "image", { ...objectOf(engineer.image), src: url }))} onPickExisting={() => void openMediaPicker("site", "image", (item) => setListEntry("engineers", index, "image", { ...objectOf(engineer.image), src: item.url }))} onClear={() => setListEntry("engineers", index, "image", { ...objectOf(engineer.image), src: "" })} /><TextField label="Photo description" value={stringOf(objectOf(engineer.image).alt)} onChange={(value) => setListEntry("engineers", index, "image", { ...objectOf(engineer.image), alt: value })} /><button className={button + " self-end justify-self-start"} onClick={() => removeListEntry("engineers", index)}>Remove engineer</button></div>)}</div></div>
            <div className="rounded-xl border border-white/10 bg-[#101a26] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Process steps</h2><p className="mt-1 text-xs text-white/45">Add or remove any number of steps.</p></div><button className={button} onClick={() => addListEntry("processSteps", { title: "", description: "" })}>＋ Add step</button></div><div className="mt-4 space-y-3">{processSteps.map((step, index) => <div key={index} className="grid gap-3 rounded-lg border border-white/10 p-4 sm:grid-cols-[1fr_1.5fr_auto]"><TextField label="Step name" value={stringOf(step.title)} onChange={(value) => setListEntry("processSteps", index, "title", value)} /><TextField label="Step description" value={stringOf(step.description)} onChange={(value) => setListEntry("processSteps", index, "description", value)} /><button className={button + " self-end"} onClick={() => removeListEntry("processSteps", index)}>Remove</button></div>)}</div></div>
            <div className="sticky bottom-3 flex flex-wrap gap-3 rounded-xl border border-white/10 bg-[#0c1520]/95 p-3 backdrop-blur"><button disabled={busy} className={primary} onClick={saveSite}>{busy ? "Saving…" : "Save website content"}</button><button className={button} onClick={() => setContentDraft(structuredClone(content))}>Discard changes</button></div>
          </div>}

          {panel === "projects" && <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-white/55">Create and manage project details and media in one form. Drafts stay hidden until published.</p><button className={primary} onClick={() => editProject()}>＋ New project</button></div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{projectRows.map((row) => <article key={row.slug} className="rounded-xl border border-white/10 bg-[#101a26] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold">{row.title}</h2><p className="mt-1 truncate text-xs text-white/40">/{row.slug}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${row.is_published ? "bg-emerald-400/10 text-emerald-300" : "bg-white/10 text-white/55"}`}>{row.is_starter ? "Preview" : row.is_published ? "Published" : "Draft"}</span></div><p className="mt-3 line-clamp-2 text-xs leading-5 text-white/50">{row.summary || "No summary yet."}</p><div className="mt-4 flex gap-2"><button className={button} onClick={() => editProject(row)}>{row.is_starter ? "Start draft" : "Edit"}</button>{!row.is_starter && <button className={button} onClick={() => { if (window.confirm(`Delete project “${row.title}”؟`)) run(async () => { await deleteProject(row.slug); setProjectRows((items) => items.filter((item) => item.slug !== row.slug)); }, "Project deleted."); }}>Delete</button>}</div></article>)}{!projectRows.length && <p className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-white/50">No projects yet. Add your first project.</p>}</div>

            {projectDraft && <div className="mt-8 max-w-5xl rounded-xl border border-white/10 bg-[#101a26] p-4 sm:p-6">
              <div className="flex justify-between gap-3"><div><h2 className="font-semibold">{editingSlug ? `Edit project:  ${editingSlug}` : "New project details"}</h2><p className="mt-1 text-xs leading-5 text-white/45">Add project details and upload its media here. You can save an incomplete project as a draft.</p></div><button className="text-sm text-white/50 hover:text-white" onClick={() => { setProjectDraft(null); setEditingSlug(""); setLockedMediaSlug(""); }}>Close</button></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TextField label="Project name *" value={stringOf(projectDraft.title)} onChange={(value) => setProjectField("title", value)} />
                <TextField label="Project URL slug *" disabled={Boolean(lockedMediaSlug)} value={stringOf(projectDraft.slug)} onChange={(value) => setProjectField("slug", value)} hint={lockedMediaSlug ? "The slug is locked to keep uploaded files linked to their folder." : "Type normally. Spaces and punctuation are converted to hyphens when you save. Example: factory-control-system"} />
                {([ ["category", "Category"], ["year", "Year"], ["location", "Location"] ] as const).map(([key, label]) => <TextField key={key} label={label} value={stringOf(projectDraft[key])} onChange={(value) => setProjectField(key, value)} />)}
                <TextField label="Short summary" multiline value={stringOf(projectDraft.summary)} onChange={(value) => setProjectField("summary", value)} />
                <TextField label="Overview" multiline value={stringOf(projectDraft.overview)} onChange={(value) => setProjectField("overview", value)} />
                {([ ["challenge", "Challenge"], ["solution", "Solution"], ["outcome", "Outcome"] ] as const).map(([key, label]) => <TextField key={key} label={label} multiline value={stringOf(projectDraft[key])} onChange={(value) => setProjectField(key, value)} />)}
                <TextField label="Systems used, one per line" multiline value={Array.isArray(projectDraft.systems) ? (projectDraft.systems as string[]).join("\n") : stringOf(projectDraft.systems)} onChange={(value) => setProjectField("systems", value)} />
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-[#0c1520] p-4 sm:p-5"><div><h3 className="font-semibold">Cover image or video</h3><p className="mt-1 text-xs leading-5 text-white/45">Optional for drafts; required before publishing. Choose the file from your device or reuse media already in this project folder.</p></div><div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,.75fr)]"><div><MediaPreview item={objectOf(projectDraft.cover) as unknown as ProjectMedia} label="Cover" /><div className="mt-3 flex flex-wrap gap-2"><label className={button + " cursor-pointer"}>{projectUploadBusy ? "Uploading…" : "＋ Upload cover"}<input className="sr-only" type="file" accept={mediaTypes} disabled={projectUploadBusy || Boolean(lockedMediaSlug && lockedMediaSlug !== stringOf(projectDraft.slug))} onChange={(event) => { void uploadProjectFiles(event.target.files, "cover"); event.currentTarget.value = ""; }} /></label><button className={button} onClick={() => void openMediaPicker(stringOf(projectDraft.slug), "any", (item) => setProjectField("cover", { ...objectOf(projectDraft.cover), type: item.resourceType, src: item.url, assetId: item.assetId, alt: stringOf(objectOf(projectDraft.cover).alt), title: stringOf(objectOf(projectDraft.cover).title) }))}>Choose existing</button></div></div><div className="space-y-3"><TextField label="Image description for accessibility" value={stringOf(objectOf(projectDraft.cover).alt)} onChange={(value) => setCoverField("alt", value)} /><TextField label="Video title (if the cover is a video)" value={stringOf(objectOf(projectDraft.cover).title)} onChange={(value) => setCoverField("title", value)} />{stringOf(objectOf(projectDraft.cover).src) && <button className={button} onClick={() => setCoverField("src", "")}>Remove cover from project</button>}</div></div></div>

              <div className="mt-5 rounded-xl border border-white/10 bg-[#0c1520] p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Project photos and videos</h3><p className="mt-1 text-xs text-white/45">These appear in order in the project gallery. You can choose multiple files at once.</p></div><div className="flex flex-wrap gap-2"><button className={button} onClick={() => void openMediaPicker(stringOf(projectDraft.slug), "any", (item) => { const media: ProjectMedia = item.resourceType === "image" ? { type: "image", src: item.url, alt: item.publicId, assetId: item.assetId } : { type: "video", src: item.url, title: item.publicId, assetId: item.assetId }; setProjectField("gallery", [...(Array.isArray(projectDraft.gallery) ? projectDraft.gallery as ProjectMedia[] : []), media]); })}>Choose existing</button><label className={button + " cursor-pointer"}>＋ Add photos or videos<input className="sr-only" type="file" accept={mediaTypes} multiple disabled={projectUploadBusy || Boolean(lockedMediaSlug && lockedMediaSlug !== stringOf(projectDraft.slug))} onChange={(event) => { void uploadProjectFiles(event.target.files, "gallery"); event.currentTarget.value = ""; }} /></label></div></div>{Array.isArray(projectDraft.gallery) && (projectDraft.gallery as ProjectMedia[]).length > 0 ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{(projectDraft.gallery as ProjectMedia[]).map((item, index) => <div key={`${item.src}-${index}`} className="rounded-lg border border-white/10 p-3"><MediaPreview item={item} label="Media" />{item.type === "image" ? <TextField label="Image description" value={item.alt} onChange={(value) => setProjectField("gallery", (projectDraft.gallery as ProjectMedia[]).map((entry, i) => i === index && entry.type === "image" ? { ...entry, alt: value } : entry))} /> : <TextField label="Video title" value={item.title} onChange={(value) => setProjectField("gallery", (projectDraft.gallery as ProjectMedia[]).map((entry, i) => i === index && entry.type === "video" ? { ...entry, title: value } : entry))} />}<button className={button + " mt-3"} onClick={() => removeProjectGallery(index)}>Remove from gallery</button></div>)}</div> : <p className="mt-4 rounded-lg border border-dashed border-white/10 p-5 text-center text-xs text-white/40">No photos or videos added yet.</p>}</div>

              <div className="mt-5 rounded-xl border border-white/10 bg-[#0c1520] p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Before and after comparison <span className="text-xs font-normal text-white/45">(optional)</span></h3><p className="mt-1 text-xs text-white/45">Upload both images to show the interactive comparison on the project page. Leave both empty to hide this section.</p></div>{Boolean(objectOf(projectDraft.beforeAfter).before || objectOf(projectDraft.beforeAfter).after) && <button className={button} onClick={() => setProjectField("beforeAfter", undefined)}>Remove comparison</button>}</div><div className="mt-4 grid gap-4 sm:grid-cols-2">{(["before", "after"] as const).map((side) => { const image = objectOf(objectOf(projectDraft.beforeAfter)[side]) as unknown as ProjectImage; return <div key={side}><MediaPreview item={image} label={side === "before" ? "Before" : "After"} /><div className="mt-3 flex flex-wrap gap-2"><label className={button + " cursor-pointer"}>＋ Upload {side === "before" ? "Before" : "After"}<input className="sr-only" type="file" accept={imageTypes} disabled={projectUploadBusy || Boolean(lockedMediaSlug && lockedMediaSlug !== stringOf(projectDraft.slug))} onChange={(event) => { void uploadProjectFiles(event.target.files, side); event.currentTarget.value = ""; }} /></label><button className={button} onClick={() => void openMediaPicker(stringOf(projectDraft.slug), "image", (item) => setProjectField("beforeAfter", { ...objectOf(projectDraft.beforeAfter), [side]: { type: "image", src: item.url, alt: stringOf(image.alt), assetId: item.assetId } }))}>Choose existing</button></div><div className="mt-3"><TextField label="Image description" value={stringOf(image.alt)} onChange={(value) => setBeforeAfterField(side, "alt", value)} /></div>{image.src && <button className={button + " mt-2"} onClick={() => setProjectField("beforeAfter", { ...objectOf(projectDraft.beforeAfter), [side]: undefined })}>Remove {side === "before" ? "Before" : "After"}</button>}</div>; })}</div></div>

              {projectUploadBusy && <div className="mt-4" role="status" aria-live="polite"><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#f5a623] transition-[width]" style={{ width: `${projectUploadProgress}%` }} /></div><p className="mt-2 text-xs text-white/50">Uploading to Cloudinary · {projectUploadProgress}%</p></div>}
              <p className="mt-4 text-xs leading-5 text-white/40">Image limit: {projectMediaLimits.imageBytes / 1024 / 1024} MB; video limit: {projectMediaLimits.videoBytes / 1024 / 1024} MB; project total: {projectMediaLimits.projectBytes / 1024 / 1024} MB.</p>
              <div className="mt-5 flex flex-wrap items-center gap-3"><label className="flex min-h-11 items-center gap-2 text-sm text-white/75"><input type="checkbox" checked={projectDraft.isPublished === true} onChange={(event) => setProjectField("isPublished", event.target.checked)} /> Publish project on the website</label><label className="flex min-h-11 items-center gap-2 text-sm text-white/75"><input type="checkbox" checked={projectDraft.isFeatured === true} onChange={(event) => setProjectField("isFeatured", event.target.checked)} /> Feature on home page</label></div>
              <div className="mt-4 flex flex-wrap gap-3"><button disabled={busy || projectUploadBusy} className={primary} onClick={saveProjectDraft}>{busy ? "Saving…" : "Save project"}</button><button className={button} onClick={() => { setMediaSlug(stringOf(projectDraft.slug) || "site"); setPanel("media"); void loadMedia(stringOf(projectDraft.slug) || "site"); }}>Open project media library</button></div>
            </div>}
          </div>}

          {panel === "media" && <div className="mt-6 max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="max-w-3xl text-sm leading-6 text-white/55">Photos and videos are organized by project folder. Upload general website files or review project media here; the main upload controls are in each project form.</p></div><label className="block min-w-52 text-xs font-semibold text-white/60">Upload folder<select className={input} value={mediaSlug} onChange={(event) => { setMediaSlug(event.target.value); setMediaFilter(event.target.value); void loadMedia(event.target.value); }}><option value="site">Website media</option>{projectRows.filter((row) => !row.is_starter).map((row) => <option key={row.slug} value={row.slug}>{row.title}</option>)}{!projectRows.some((row) => row.slug === mediaSlug) && mediaSlug !== "site" && <option value={mediaSlug}>{mediaSlug}</option>}</select></label></div>
            <div className="mt-5 rounded-xl border border-white/10 bg-[#101a26] p-5"><h2 className="font-semibold">Upload media to the selected folder</h2><p className="mt-1 text-xs text-white/45">For team photos or section images not tied to a project.</p><input className="mt-4 block w-full text-sm text-white/60 file:mr-4 file:min-h-10 file:rounded-lg file:border-0 file:bg-[#f5a623] file:px-4 file:font-bold file:text-[#08111c]" type="file" accept={mediaTypes} multiple onChange={(event) => setMediaFiles(Array.from(event.target.files ?? []))} /><p className="mt-3 text-xs text-white/45">Images up to 10 MB · videos up to 30 MB · 100 MB total per folder.</p>{mediaFiles.length > 0 && <div className="mt-3 rounded-lg bg-black/20 p-3"><p className="text-xs text-white/60">{mediaFiles.length} file(s) · {(mediaCheck.totalBytes / 1024 / 1024).toFixed(1)} MB</p>{mediaCheck.errors.map((error) => <p key={error} className="mt-2 text-xs text-red-300">{error}</p>)}</div>}{uploading && <div className="mt-4"><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#f5a623]" style={{ width: `${uploadProgress}%` }} /></div><p className="mt-2 text-xs text-white/50">Uploading · {uploadProgress}%</p></div>}<button disabled={!mediaFiles.length || !mediaCheck.valid || uploading} className={primary + " mt-4"} onClick={uploadLibraryFiles}>{uploading ? "Uploading…" : "Upload files"}</button></div>
            <div className="mt-7 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-semibold">Media gallery</h2><p className="mt-1 text-xs text-white/45">Select an image or video to preview it. Deleting permanently removes it from Cloudinary.</p></div><div className="flex flex-wrap items-end gap-2"><label className="text-xs text-white/50">Filter<select className={input + " mt-1 min-w-40"} value={mediaFilter} onChange={(event) => setMediaFilter(event.target.value)}><option value="all">All folders</option><option value="site">Website media</option>{projectFolderOptions.filter((slug) => slug !== "site").map((slug) => <option key={slug} value={slug}>{projectRows.find((row) => row.slug === slug)?.title ?? slug}</option>)}</select></label><button disabled={loadingMedia} className={button} onClick={() => void loadAllMedia()}>{loadingMedia ? "Loading…" : "Refresh gallery"}</button></div></div>
            {visibleMedia.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleMedia.map((item) => <article key={item.assetId} className="overflow-hidden rounded-xl border border-white/10 bg-[#101a26]"><button className="relative block aspect-video w-full bg-[#0b131e]" aria-label={`Preview ${item.publicId}`} onClick={() => setPreviewUrl(item.url)}>{item.resourceType === "image" ? <Image src={item.url} alt={item.publicId} fill unoptimized sizes="(min-width: 1280px) 30vw, 50vw" className="object-cover" /> : <video src={item.url} preload="metadata" muted className="size-full object-cover" />}<span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-[10px] uppercase">{item.resourceType}</span></button><div className="p-4"><p className="truncate text-sm font-semibold" title={item.publicId}>{item.publicId.split("/").at(-1)}</p><p className="mt-1 text-xs text-white/40">{item.projectSlug === "site" ? "Website media" : projectRows.find((row) => row.slug === item.projectSlug)?.title ?? item.projectSlug} · {(item.size / 1024 / 1024).toFixed(1)} MB</p><div className="mt-3 flex flex-wrap gap-2"><a className={button} href={item.url} target="_blank" rel="noreferrer">Open file</a><a className={button} href={item.url} download>Download</a><button className={button} onClick={() => void removeMedia(item)}>Delete</button></div></div></article>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-white/15 p-6 text-sm text-white/45">{loadingMedia ? "Loading files…" : "No media in this folder yet."}</p>}
            {previewUrl && <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="Preview media" onClick={() => setPreviewUrl("")}><button className="absolute right-5 top-5 rounded-full border border-white/20 bg-[#101a26] px-4 py-2 text-sm" onClick={() => setPreviewUrl("")}>Close ✕</button>{previewUrl.match(/\.(mp4|webm|mov)(\?|$)/i) ? <video src={previewUrl} controls autoPlay className="max-h-[85vh] max-w-[90vw]" onClick={(event) => event.stopPropagation()} /> : <Image src={previewUrl} alt="Preview image" width={1600} height={1200} unoptimized className="max-h-[85vh] w-auto object-contain" onClick={(event) => event.stopPropagation()} />}</div>}
          </div>}

          {mediaPicker && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setMediaPicker(null); }}><section role="dialog" aria-modal="true" aria-labelledby="media-picker-title" className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/15 bg-[#101a26] p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><h2 id="media-picker-title" className="text-lg font-bold">Choose existing media</h2><p className="mt-1 text-sm text-white/50">Reuse a file already stored in {mediaPicker.folder === "site" ? "website media" : "this project"}; it will not upload another copy.</p></div><button type="button" className={button} onClick={() => setMediaPicker(null)}>Close</button></div>{mediaPicker.items.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{mediaPicker.items.map((item) => <article key={item.assetId} className="overflow-hidden rounded-xl border border-white/10 bg-[#0b131e]"><div className="relative aspect-video bg-black/20">{item.resourceType === "image" ? <Image src={item.url} alt="" fill unoptimized sizes="(min-width: 1024px) 30vw, 50vw" className="object-contain" /> : <video src={item.url} preload="metadata" muted className="size-full object-contain" />}</div><div className="p-3"><p className="truncate text-xs text-white/60" title={item.publicId}>{item.publicId.split("/").at(-1)}</p><button type="button" className={primary + " mt-3 w-full"} onClick={() => { mediaPicker.onSelect(item); setMediaPicker(null); setMessage("Existing Cloudinary media selected. Save your changes to apply it."); }}>Use this file</button></div></article>)}</div> : <p className="mt-6 rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">No saved {mediaPicker.resourceType === "any" ? "media" : `${mediaPicker.resourceType}s`} in this folder yet. Upload a file once, then reuse it from here.</p>}</section></div>}
          <div className="mt-10 border-t border-white/10 pt-4 lg:hidden"><form action={signOut}><button className={button}>Sign out</button></form></div>
        </section>
      </div>
    </main>
  );
}
