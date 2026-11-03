import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { projectMediaLimits } from "@/lib/projects";
import { cloudinaryAdminAuth, cloudinaryAdminUrl, cloudinaryConfig, signCloudinaryParams, verifyCloudinaryResponse } from "@/lib/cloudinary/server";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const videoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const folderSlugIsValid = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

async function authorized() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Sign in to manage media." }, { status: 401 }) };
  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return { response: NextResponse.json({ error: "This account is not authorized to manage media." }, { status: 403 }) };
  return { supabase, user };
}

async function getProjectMediaBytes(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data, error } = await supabase.from("media_assets").select("bytes").eq("project_slug", slug);
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((total, item) => total + Number(item.bytes), 0);
}

export async function GET(request: Request) {
  try {
    const auth = await authorized();
    if ("response" in auth) return auth.response;
    const slug = new URL(request.url).searchParams.get("projectSlug") ?? "";
    if (!folderSlugIsValid(slug)) return NextResponse.json({ error: "Enter a valid content or project folder." }, { status: 400 });
    const { data, error } = await auth.supabase.from("media_assets").select("asset_id,project_slug,public_id,secure_url,resource_type,bytes,format,created_at").eq("project_slug", slug).order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ items: (data ?? []).map((item) => ({
      assetId: item.asset_id, projectSlug: item.project_slug, publicId: item.public_id,
      url: item.secure_url, resourceType: item.resource_type, size: Number(item.bytes),
      format: item.format, mimeType: `${item.resource_type}/${item.format}`,
    })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load media." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorized();
    if ("response" in auth) return auth.response;
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? "");
    const slug = String(body.projectSlug ?? "");
    if (!folderSlugIsValid(slug)) return NextResponse.json({ error: "Enter a valid content or project folder." }, { status: 400 });
    const folder = `valex/${slug}`;

    if (action === "sign") {
      const mimeType = String(body.mimeType ?? "");
      const bytes = Number(body.bytes);
      const fileName = String(body.fileName ?? "").toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "asset";
      const resourceType = imageTypes.has(mimeType) ? "image" : videoTypes.has(mimeType) ? "video" : "";
      if (!resourceType) return NextResponse.json({ error: "Choose a JPG, PNG, WebP, AVIF, MP4, WebM, or MOV file." }, { status: 400 });
      const limit = resourceType === "video" ? projectMediaLimits.videoBytes : projectMediaLimits.imageBytes;
      if (!Number.isInteger(bytes) || bytes <= 0 || bytes > limit) return NextResponse.json({ error: `This file exceeds the ${Math.round(limit / 1024 / 1024)} MB ${resourceType} limit.` }, { status: 400 });
      const currentBytes = await getProjectMediaBytes(auth.supabase, slug);
      if (currentBytes + bytes > projectMediaLimits.projectBytes) return NextResponse.json({ error: "This folder would exceed its 100 MB total media limit." }, { status: 400 });
      const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
      const timestamp = Math.floor(Date.now() / 1000);
      const publicId = `${crypto.randomUUID()}-${fileName}`;
      const params = { folder, public_id: publicId, timestamp };
      return NextResponse.json({ cloudName, apiKey, timestamp, folder, publicId, resourceType, signature: signCloudinaryParams(params, apiSecret) });
    }

    if (action === "register") {
      const assetId = String(body.assetId ?? "");
      const publicId = String(body.publicId ?? "");
      const version = Number(body.version);
      const responseSignature = String(body.signature ?? "");
      const reportedFolder = String(body.folder ?? "");
      const resourceType = String(body.resourceType ?? "");
      const { cloudName, apiSecret } = cloudinaryConfig();
      if (!assetId || !publicId || !(resourceType === "image" || resourceType === "video") || !folderSlugIsValid(slug)) return NextResponse.json({ error: "Cloudinary returned incomplete asset information." }, { status: 400 });
      if (!verifyCloudinaryResponse(publicId, version, responseSignature, apiSecret)) return NextResponse.json({ error: "Cloudinary upload response could not be verified." }, { status: 400 });
      if (reportedFolder !== folder) return NextResponse.json({ error: "The uploaded asset is not in this project's media folder." }, { status: 400 });

      const assetLookupUrl = cloudinaryAdminUrl(`resources/by_asset_ids?asset_ids%5B%5D=${encodeURIComponent(assetId)}`);
      const assetResponse = await fetch(assetLookupUrl, { headers: { Authorization: cloudinaryAdminAuth() }, cache: "no-store" });
      if (!assetResponse.ok) return NextResponse.json({ error: "Could not verify the uploaded file in Cloudinary." }, { status: 502 });
      const assetResult = await assetResponse.json() as { resources?: { asset_id: string; public_id: string; asset_folder?: string; secure_url: string; resource_type: string; bytes: number; format: string }[] };
      const asset = assetResult.resources?.find((item) => item.asset_id === assetId);
      if (!asset || asset.public_id !== publicId || asset.resource_type !== resourceType || asset.asset_folder !== folder || !asset.secure_url.startsWith(`https://res.cloudinary.com/${cloudName}/`)) return NextResponse.json({ error: "Cloudinary asset details did not match the signed upload." }, { status: 400 });

      const limit = resourceType === "video" ? projectMediaLimits.videoBytes : projectMediaLimits.imageBytes;
      if (asset.bytes > limit) {
        await destroyCloudinaryAsset(asset.asset_id);
        return NextResponse.json({ error: `Cloudinary asset exceeds the ${Math.round(limit / 1024 / 1024)} MB file limit.` }, { status: 400 });
      }
      if (await getProjectMediaBytes(auth.supabase, slug) + asset.bytes > projectMediaLimits.projectBytes) {
        await destroyCloudinaryAsset(asset.asset_id);
        return NextResponse.json({ error: "This project's media would exceed 100 MB total." }, { status: 400 });
      }

      const { error } = await auth.supabase.from("media_assets").insert({
        asset_id: asset.asset_id, project_slug: slug, public_id: asset.public_id,
        secure_url: asset.secure_url, resource_type: asset.resource_type,
        bytes: asset.bytes, format: asset.format, uploaded_by: auth.user.id,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ item: { assetId: asset.asset_id, projectSlug: slug, publicId: asset.public_id, url: asset.secure_url, resourceType: asset.resource_type, size: asset.bytes, format: asset.format, mimeType: `${asset.resource_type}/${asset.format}` } });
    }

    return NextResponse.json({ error: "Unsupported media action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not sign or register media." }, { status: 500 });
  }
}

async function destroyCloudinaryAsset(assetId: string) {
  const response = await fetch(cloudinaryAdminUrl("resources"), {
    method: "DELETE",
    headers: { Authorization: cloudinaryAdminAuth(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ "asset_ids[]": assetId }),
  });
  if (!response.ok) throw new Error("Cloudinary could not remove the asset.");
}

export async function DELETE(request: Request) {
  try {
    const auth = await authorized();
    if ("response" in auth) return auth.response;
    const body = await request.json() as { projectSlug?: string; assetId?: string };
    const slug = String(body.projectSlug ?? "");
    const assetId = String(body.assetId ?? "");
    if (!folderSlugIsValid(slug) || !assetId) return NextResponse.json({ error: "Invalid media asset." }, { status: 400 });
    const { data: item, error: lookupError } = await auth.supabase.from("media_assets").select("asset_id").eq("asset_id", assetId).eq("project_slug", slug).maybeSingle();
    if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 400 });
    if (!item) return NextResponse.json({ error: "Media asset was not found in this folder." }, { status: 404 });
    await destroyCloudinaryAsset(assetId);
    const { error } = await auth.supabase.from("media_assets").delete().eq("asset_id", assetId).eq("project_slug", slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete media." }, { status: 500 });
  }
}
