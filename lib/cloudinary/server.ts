import "server-only";
import { timingSafeEqual } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

export function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary is not configured. Add its cloud name, API key, and API secret to .env.local.");
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return { cloudName, apiKey, apiSecret };
}

export function signCloudinaryParams(params: Record<string, string | number>, secret = cloudinaryConfig().apiSecret) {
  return cloudinary.utils.api_sign_request(params, secret);
}

export function verifyCloudinaryResponse(publicId: string, version: number, signature: string, secret: string) {
  const expected = signCloudinaryParams({ public_id: publicId, version }, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function cloudinaryAdminUrl(path: string) {
  const { cloudName } = cloudinaryConfig();
  return `https://api.cloudinary.com/v1_1/${cloudName}/${path}`;
}

export function cloudinaryAdminAuth() {
  const { apiKey, apiSecret } = cloudinaryConfig();
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}
