import { randomBytes } from "crypto";
import { getOAuthIssuer } from "@/lib/oauth-security";
import { signToken, verifyToken } from "@/lib/oauth-utils";

export const IMAGE_UPLOAD_MAX_BYTES = 5_500_000;
export const IMAGE_UPLOAD_TICKET_TTL_MS = 15 * 60 * 1000;

export type ImageUploadTicketMeta = {
  idempotency_key: string;
  image_id: string;
  purpose: string;
  alt: string;
  aspect?: string;
  filename?: string;
  article_key?: string;
  prompt?: string;
};

export function createImageUploadSession(meta: ImageUploadTicketMeta) {
  const upload_id = randomBytes(12).toString("hex");
  const ticket = signToken(
    {
      type: "image_upload",
      upload_id,
      ...meta,
    },
    IMAGE_UPLOAD_TICKET_TTL_MS
  );
  const origin = getOAuthIssuer();
  return {
    upload_id,
    method: "POST" as const,
    put_url: `${origin}/api/mcp-image-upload`,
    authorization: `Bearer ${ticket}`,
    content_type: "image/png",
    max_bytes: IMAGE_UPLOAD_MAX_BYTES,
    expires_in_sec: IMAGE_UPLOAD_TICKET_TTL_MS / 1000,
    instruction:
      "ChatGPT MCP truncates image_base64. Do NOT send pixels through MCP. POST the original PNG/JPEG bytes (not base64) to put_url with the Authorization header. Python: urllib.request.Request(put_url, data=open(path,'rb').read(), method='POST', headers={'Authorization': authorization, 'Content-Type': 'image/png'}).",
  };
}

export function verifyImageUploadTicket(raw: string | null) {
  if (!raw) return null;
  const decoded = verifyToken(raw);
  if (!decoded || decoded.type !== "image_upload") return null;
  if (typeof decoded.upload_id !== "string" || typeof decoded.image_id !== "string") return null;
  if (typeof decoded.purpose !== "string" || typeof decoded.alt !== "string") return null;
  if (typeof decoded.idempotency_key !== "string") return null;
  return decoded as ImageUploadTicketMeta & { type: "image_upload"; upload_id: string; exp: number };
}
