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

export function assertImageQa(
  bytes: Buffer,
  sniff: ImageSniff,
  kind: "cover" | "inline" | "infographic"
): string[] {
  const gates: string[] = [];
  if (sniff.ext === "svg") {
    gates.push("IMAGE_RESOLUTION_PASS", "IMAGE_SHARPNESS_PASS", "IMAGE_FORMAT_PASS");
    return gates;
  }
  const minW = kind === "cover" ? 1280 : 1000;
  const minH = kind === "cover" ? 720 : 700;
  if (!sniff.width || !sniff.height || sniff.width < minW || sniff.height < minH) {
    throw new Error(
      `IMAGE_QA_FAILED: IMAGE_RESOLUTION_PASS width=${sniff.width} height=${sniff.height} min=${minW}x${minH}`
    );
  }
  gates.push("IMAGE_RESOLUTION_PASS");
  const minBytes = sniff.ext === "jpg" ? 50_000 : 80_000;
  if (bytes.length < minBytes) {
    throw new Error(`IMAGE_QA_FAILED: IMAGE_SHARPNESS_PASS file too small (${bytes.length} bytes) for ${sniff.width}x${sniff.height}`);
  }
  gates.push("IMAGE_SHARPNESS_PASS", "IMAGE_FORMAT_PASS");
  return gates;
}
