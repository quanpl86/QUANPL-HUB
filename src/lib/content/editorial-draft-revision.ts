export type DraftRevisionRequest = {
  fix_content: boolean;
  fix_style: boolean;
  fix_cover: boolean;
  fix_inline_images: boolean;
  fix_seo: boolean;
  fix_aio: boolean;
  seo_target: number | null;
  notes: string;
};

export const EMPTY_DRAFT_REVISION: DraftRevisionRequest = {
  fix_content: false,
  fix_style: false,
  fix_cover: false,
  fix_inline_images: false,
  fix_seo: false,
  fix_aio: false,
  seo_target: null,
  notes: "",
};

const FLAG_LABELS: Array<[keyof DraftRevisionRequest, string]> = [
  ["fix_content", "Câu chữ / nội dung"],
  ["fix_style", "Văn phong"],
  ["fix_cover", "Ảnh bìa — tạo lại cover"],
  ["fix_inline_images", "Ảnh trong bài — tạo lại ảnh body"],
  ["fix_seo", "Chuẩn hoá SEO"],
  ["fix_aio", "Chuẩn hoá AIO"],
];

export function parseSeoTarget(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 95 || rounded > 100) return null;
  return rounded;
}

export function normalizeDraftRevisionRequest(
  raw: Partial<DraftRevisionRequest> | string | null | undefined
): DraftRevisionRequest {
  if (typeof raw === "string") {
    return { ...EMPTY_DRAFT_REVISION, notes: raw.trim() };
  }
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    fix_content: Boolean(src.fix_content),
    fix_style: Boolean(src.fix_style),
    fix_cover: Boolean(src.fix_cover),
    fix_inline_images: Boolean(src.fix_inline_images),
    fix_seo: Boolean(src.fix_seo),
    fix_aio: Boolean(src.fix_aio),
    seo_target: parseSeoTarget(src.seo_target),
    notes: String(src.notes || "").trim(),
  };
}

export function assertDraftRevisionRequest(request: DraftRevisionRequest) {
  const hasFlag = FLAG_LABELS.some(([key]) => request[key] === true);
  if (!hasFlag && !request.notes) {
    throw new Error("Cần tick ít nhất một mục cần sửa hoặc ghi rõ yêu cầu");
  }
}

export function formatDraftRevisionRequest(request: DraftRevisionRequest): string {
  const lines = ["YÊU CẦU SỬA DRAFT"];
  for (const [key, label] of FLAG_LABELS) {
    if (request[key]) lines.push(`- ${label}`);
  }
  if (request.seo_target != null) {
    lines.push(`- Điểm SEO mục tiêu ≥ ${request.seo_target} (cổng hệ thống tối thiểu 95)`);
  }
  if (request.notes) {
    lines.push(`Chi tiết: ${request.notes}`);
  }
  lines.push(
    "ChatGPT: gọi get_editorial_draft(calendar_id) rồi update_blog_draft cùng calendar_id. Ảnh cần tạo lại thì generate_and_upload_blog_image trước. Không tạo bài mới. Không sửa bài đã đăng."
  );
  return lines.join("\n");
}

export function parseDraftRevisionFromFeedback(text: string | null | undefined): DraftRevisionRequest | null {
  const body = String(text || "").trim();
  if (!body) return null;
  if (!body.includes("YÊU CẦU SỬA DRAFT")) {
    return normalizeDraftRevisionRequest(body);
  }
  const detail = /Chi tiết:\s*([\s\S]*?)(?:\nChatGPT:|$)/.exec(body);
  const seo = /Điểm SEO mục tiêu\s*≥\s*(\d+)/.exec(body);
  return normalizeDraftRevisionRequest({
    fix_content: body.includes("Câu chữ"),
    fix_style: body.includes("Văn phong"),
    fix_cover: body.includes("Ảnh bìa"),
    fix_inline_images: body.includes("Ảnh trong bài"),
    fix_seo: body.includes("Chuẩn hoá SEO") || Boolean(seo),
    fix_aio: body.includes("Chuẩn hoá AIO"),
    seo_target: seo ? Number(seo[1]) : null,
    notes: detail?.[1]?.trim() || "",
  });
}
