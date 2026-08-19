import { NextResponse } from "next/server";
import { IMAGE_UPLOAD_MAX_BYTES, verifyImageUploadTicket } from "@/lib/content/image-upload-ticket";
import { uploadBlogImage } from "@/lib/content/blog-image";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: Request) {
  const ticket = verifyImageUploadTicket(req.headers.get("authorization"));
  if (!ticket) {
    return NextResponse.json(
      { error: "IMAGE_UPLOAD_FAILED: invalid or expired upload ticket. Call start_image_upload again." },
      { status: 401, headers: cors }
    );
  }

  const bytes = Buffer.from(await req.arrayBuffer());
  if (bytes.length < 32) {
    return NextResponse.json(
      { error: "IMAGE_UPLOAD_FAILED: empty body. POST original image bytes, not JSON/base64." },
      { status: 400, headers: cors }
    );
  }
  if (bytes.length > IMAGE_UPLOAD_MAX_BYTES) {
    return NextResponse.json(
      { error: `IMAGE_UPLOAD_FAILED: body exceeds ${IMAGE_UPLOAD_MAX_BYTES} bytes` },
      { status: 413, headers: cors }
    );
  }

  try {
    const result = await uploadBlogImage({
      idempotency_key: ticket.idempotency_key,
      image_id: ticket.image_id,
      purpose: ticket.purpose,
      alt: ticket.alt,
      aspect: ticket.aspect,
      filename: ticket.filename,
      article_key: ticket.article_key,
      prompt: ticket.prompt,
      image_bytes: bytes,
    });
    return NextResponse.json(result, { headers: cors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "IMAGE_UPLOAD_FAILED";
    return NextResponse.json({ error: message }, { status: 422, headers: cors });
  }
}
