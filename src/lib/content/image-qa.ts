export type ImageSniff = {
  mime: string;
  ext: "png" | "jpg" | "webp" | "gif" | "svg";
  width: number | null;
  height: number | null;
};

export function sniffImage(bytes: Buffer): ImageSniff {
  const head = bytes.subarray(0, Math.min(bytes.length, 256)).toString("utf8").trimStart();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) {
    const svg = bytes.toString("utf8");
    const w = /(?:width=["'](\d+)|viewBox=["'][\d.\s]+[\d.]+\s+(\d+))/i.exec(svg);
    const h = /(?:height=["'](\d+)|viewBox=["'][\d.\s]+[\d.]+\s+[\d.]+\s+(\d+))/i.exec(svg);
    return {
      mime: "image/svg+xml",
      ext: "svg",
      width: w ? Number(w[1] || w[2]) : 1600,
      height: h ? Number(h[1] || h[2]) : 900,
    };
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return {
      mime: "image/png",
      ext: "png",
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const dim = jpegSize(bytes);
    return { mime: "image/jpeg", ext: "jpg", width: dim?.width ?? null, height: dim?.height ?? null };
  }
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return { mime: "image/webp", ext: "webp", ...webpSize(bytes) };
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return { mime: "image/gif", ext: "gif", width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
  }
  throw new Error("IMAGE_QA_FAILED: IMAGE_FORMAT_UNKNOWN");
}

const PNG_IEND = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
const TRUNCATED_HINT =
  "IMAGE_UPLOAD_FAILED: BASE64_TRUNCATED. ChatGPT MCP cuts large image_base64 before Hub. Do NOT compress/resize. Pass the native ChatGPT file attachment to upload_generated_image_file.";

export function assertCompleteRaster(bytes: Buffer): void {
  if (bytes.length < 32) throw new Error(TRUNCATED_HINT);
  const sniff = sniffImage(bytes);
  if (sniff.ext === "svg") return;
  if (sniff.ext === "png" && (bytes.length < 67 || !bytes.subarray(-12).equals(PNG_IEND))) {
    throw new Error(TRUNCATED_HINT);
  }
  if (sniff.ext === "jpg" && (bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9)) {
    throw new Error(TRUNCATED_HINT);
  }
  if (sniff.ext === "webp") {
    const declared = bytes.readUInt32LE(4);
    if (declared + 8 > bytes.length) throw new Error(TRUNCATED_HINT);
  }
}

function jpegSize(bytes: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    const size = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3 && offset + 7 < bytes.length) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + size;
  }
  return null;
}

function webpSize(bytes: Buffer): { width: number | null; height: number | null } {
  const chunk = bytes.toString("ascii", 12, 16);
  if (chunk === "VP8X" && bytes.length >= 30) {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    return { width, height };
  }
  if (chunk === "VP8 " && bytes.length >= 30) {
    return { width: bytes.readUInt16LE(26), height: bytes.readUInt16LE(28) };
  }
  return { width: null, height: null };
}

export const IMAGE_QA_MIN_SIZE = {
  cover: { width: 1536, height: 864 },
  inline: { width: 1280, height: 720 },
  infographic: { width: 1000, height: 700 },
} as const;

const QUALITY_HINT =
  "Do NOT resize, convert to small WebP, or compress to fit the tool call. Upload the original PNG (cover ≥1536×864, inline ≥1280×720). If MCP truncates image_base64, pass source_url of the original HTTPS file instead — never a downscaled 800×450 WebP.";

export function minRasterBytes(width: number, height: number, ext: ImageSniff["ext"]): number {
  const pixels = Math.max(1, width * height);
  if (ext === "jpg") return Math.max(180_000, Math.ceil(pixels * 0.14));
  if (ext === "webp") return Math.max(200_000, Math.ceil(pixels * 0.16));
  return Math.max(250_000, Math.ceil(pixels * 0.22));
}

export function assertImageQa(
  bytes: Buffer,
  sniff: ImageSniff,
  kind: "cover" | "inline" | "infographic"
): string[] {
  const gates: string[] = [];
  if (sniff.ext === "svg") {
    gates.push("IMAGE_RESOLUTION_PASS", "IMAGE_SHARPNESS_PASS", "IMAGE_FORMAT_PASS", "IMAGE_COMPRESSION_PASS");
    return gates;
  }
  const min = IMAGE_QA_MIN_SIZE[kind];
  if (!sniff.width || !sniff.height || sniff.width < min.width || sniff.height < min.height) {
    throw new Error(
      `IMAGE_QA_FAILED: IMAGE_RESOLUTION_PASS width=${sniff.width} height=${sniff.height} min=${min.width}x${min.height}. ${QUALITY_HINT}`
    );
  }
  gates.push("IMAGE_RESOLUTION_PASS");
  const minBytes = minRasterBytes(sniff.width, sniff.height, sniff.ext);
  if (bytes.length < minBytes) {
    throw new Error(
      `IMAGE_QA_FAILED: IMAGE_COMPRESSION_TOO_HIGH bytes=${bytes.length} min=${minBytes} for ${sniff.width}x${sniff.height} ${sniff.ext}. ${QUALITY_HINT}`
    );
  }
  gates.push("IMAGE_SHARPNESS_PASS", "IMAGE_COMPRESSION_PASS", "IMAGE_FORMAT_PASS");
  return gates;
}
