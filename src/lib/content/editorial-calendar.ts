export type InternalLinkSuggestion = {
  post_id?: string;
  slug?: string;
  title?: string;
  reason?: string;
};

export const EDITORIAL_TIMEZONE = "Asia/Ho_Chi_Minh";

export const EDITORIAL_SLOT_STATUSES = [
  "proposed",
  "approved",
  "revision_requested",
  "writing",
  "drafted",
  "published",
  "cancelled",
] as const;

export type EditorialSlotStatus = (typeof EDITORIAL_SLOT_STATUSES)[number];

export type EditorialSlot = {
  id: string;
  week_id: string | null;
  title: string;
  angle: string | null;
  audience: string | null;
  goal: string | null;
  outline: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  field: string | null;
  subject: string | null;
  category: string | null;
  tags: string[];
  notes: string | null;
  search_intent: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[];
  why_this_article: string | null;
  source_strategy: string | null;
  internal_link_suggestions: InternalLinkSuggestion[];
  article_objectives: string[];
  revision_number: number;
  based_on_revision: number | null;
  admin_feedback: string | null;
  status: EditorialSlotStatus;
  item_order: number;
  result_post_id: string | null;
  write_attempts: number;
  write_fails: number;
  last_write_error: string | null;
  last_seo_score: number | null;
  last_due_reminder_at: string | null;
  comments: import("./editorial-comments").EditorialComment[];
  activity: import("./editorial-plan").EditorialActivity[];
  created_at: string;
  updated_at: string;
};

export type EditorialSlotInput = {
  id?: string;
  title: string;
  angle?: string;
  audience?: string;
  goal?: string;
  outline?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  field?: string;
  subject?: string;
  category?: string;
  tags?: string[];
  notes?: string;
  search_intent?: string;
  primary_keyword?: string;
  secondary_keywords?: string[];
  why_this_article?: string;
  source_strategy?: string;
  internal_link_suggestions?: InternalLinkSuggestion[];
  article_objectives?: string[];
  target_audience?: string;
  content_angle?: string;
};

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 12);
}

export function normalizeDate(value?: string | null): string | null {
  if (!value?.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    throw new Error("INVALID_DATE: use YYYY-MM-DD");
  }
  return value.trim();
}

export function normalizeTime(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) throw new Error("INVALID_TIME: use HH:MM");
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error("INVALID_TIME: use HH:MM");
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function mondayOf(isoDate: string): string {
  const normalized = normalizeDate(isoDate);
  if (!normalized) throw new Error("INVALID_WEEK_START: use YYYY-MM-DD");
  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

export function parseSlotDueAt(date: string | null, time: string | null): Date | null {
  const day = normalizeDate(date);
  if (!day) return null;
  const clock = normalizeTime(time) || "00:00";
  return new Date(`${day}T${clock}:00+07:00`);
}

export function isSlotDue(slot: Pick<EditorialSlot, "scheduled_date" | "scheduled_time">, now = new Date()): boolean {
  const dueAt = parseSlotDueAt(slot.scheduled_date, slot.scheduled_time);
  if (!dueAt) return true;
  return now.getTime() >= dueAt.getTime();
}

function applySlotAliases<T extends EditorialSlotInput>(slot: T): T {
  return {
    ...slot,
    audience: slot.audience || slot.target_audience,
    angle: slot.angle || slot.content_angle,
  };
}

function asStringListField(value: unknown, max = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, max);
}

function asLinkSuggestions(value: unknown): InternalLinkSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 6).map((item) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      post_id: row.post_id ? String(row.post_id) : undefined,
      slug: row.slug ? String(row.slug) : undefined,
      title: row.title ? String(row.title) : undefined,
      reason: row.reason ? String(row.reason) : undefined,
    };
  });
}

export function assertWeeklySlots(slots: EditorialSlotInput[]) {
  if (!slots.length) throw new Error("EMPTY_CALENDAR: need at least 1 slot");
  if (slots.length > 12) throw new Error("CALENDAR_LIMIT: max 12 slots per week");
  for (const raw of slots) {
    const slot = applySlotAliases(raw);
    if (!slot.title?.trim()) throw new Error("INVALID_SLOT: title is required");
    if (!slot.outline?.trim()) {
      throw new Error(`INVALID_SLOT: outline (nội dung / dàn ý) is required for "${slot.title}"`);
    }
    if (!slot.scheduled_date?.trim()) {
      throw new Error(`INVALID_SLOT: scheduled_date is required for "${slot.title}"`);
    }
    if (!slot.search_intent?.trim()) {
      throw new Error(`INVALID_SLOT: search_intent is required for "${slot.title}"`);
    }
    if (!slot.primary_keyword?.trim()) {
      throw new Error(`INVALID_SLOT: primary_keyword is required for "${slot.title}"`);
    }
    if (!slot.why_this_article?.trim()) {
      throw new Error(`INVALID_SLOT: why_this_article is required for "${slot.title}"`);
    }
    if (!slot.source_strategy?.trim()) {
      throw new Error(`INVALID_SLOT: source_strategy is required for "${slot.title}"`);
    }
  }
}

export function toSlot(row: any): EditorialSlot {
  return {
    id: row.id,
    week_id: row.week_id || null,
    title: row.title,
    angle: row.angle,
    audience: row.audience,
    goal: row.goal,
    outline: row.outline || null,
    scheduled_date: row.scheduled_date,
    scheduled_time: row.scheduled_time ? String(row.scheduled_time).slice(0, 5) : null,
    field: row.field,
    subject: row.subject,
    category: row.category,
    tags: asTags(row.tags),
    notes: row.notes,
    search_intent: row.search_intent || null,
    primary_keyword: row.primary_keyword || null,
    secondary_keywords: asStringListField(row.secondary_keywords, 8),
    why_this_article: row.why_this_article || null,
    source_strategy: row.source_strategy || null,
    internal_link_suggestions: asLinkSuggestions(row.internal_link_suggestions),
    article_objectives: asStringListField(row.article_objectives, 8),
    revision_number: Number(row.revision_number || 1),
    based_on_revision: row.based_on_revision == null ? null : Number(row.based_on_revision),
    admin_feedback: row.admin_feedback,
    status: row.status,
    item_order: Number(row.item_order || 0),
    result_post_id: row.result_post_id,
    write_attempts: Number(row.write_attempts || 0),
    write_fails: Number(row.write_fails || 0),
    last_write_error: row.last_write_error || null,
    last_seo_score: row.last_seo_score == null ? null : Number(row.last_seo_score),
    last_due_reminder_at: row.last_due_reminder_at || null,
    comments: [],
    activity: [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function slotRow(slot: EditorialSlotInput, extras: Record<string, unknown> = {}) {
  const normalized = applySlotAliases(slot);
  if (!normalized.title?.trim()) throw new Error("INVALID_SLOT: title is required");
  return {
    title: normalized.title.trim(),
    angle: normalized.angle?.trim() || null,
    audience: normalized.audience?.trim() || null,
    goal: normalized.goal?.trim() || null,
    outline: normalized.outline?.trim() || null,
    scheduled_date: normalizeDate(normalized.scheduled_date),
    scheduled_time: normalizeTime(normalized.scheduled_time),
    field: normalized.field?.trim() || null,
    subject: normalized.subject?.trim() || null,
    category: normalized.category?.trim() || null,
    tags: asTags(normalized.tags),
    notes: normalized.notes?.trim() || null,
    search_intent: normalized.search_intent?.trim() || null,
    primary_keyword: normalized.primary_keyword?.trim() || null,
    secondary_keywords: asStringListField(normalized.secondary_keywords, 8),
    why_this_article: normalized.why_this_article?.trim() || null,
    source_strategy: normalized.source_strategy?.trim() || null,
    internal_link_suggestions: asLinkSuggestions(normalized.internal_link_suggestions),
    article_objectives: asStringListField(normalized.article_objectives, 8),
    ...extras,
  };
}

function mergedSlot(current: EditorialSlot, patch: Partial<EditorialSlotInput>): EditorialSlotInput {
  return {
    title: patch.title ?? current.title,
    angle: patch.angle ?? current.angle ?? undefined,
    audience: patch.audience ?? current.audience ?? undefined,
    goal: patch.goal ?? current.goal ?? undefined,
    outline: patch.outline ?? current.outline ?? undefined,
    scheduled_date: patch.scheduled_date ?? current.scheduled_date ?? undefined,
    scheduled_time: patch.scheduled_time ?? current.scheduled_time ?? undefined,
    field: patch.field ?? current.field ?? undefined,
    subject: patch.subject ?? current.subject ?? undefined,
    category: patch.category ?? current.category ?? undefined,
    tags: patch.tags ?? current.tags,
    notes: patch.notes ?? current.notes ?? undefined,
    search_intent: patch.search_intent ?? current.search_intent ?? undefined,
    primary_keyword: patch.primary_keyword ?? current.primary_keyword ?? undefined,
    secondary_keywords: patch.secondary_keywords ?? current.secondary_keywords,
    why_this_article: patch.why_this_article ?? current.why_this_article ?? undefined,
    source_strategy: patch.source_strategy ?? current.source_strategy ?? undefined,
    internal_link_suggestions: patch.internal_link_suggestions ?? current.internal_link_suggestions,
    article_objectives: patch.article_objectives ?? current.article_objectives,
  };
}

export class EditorialCalendarRepository {
  static async list(
    supabase: any,
    status?: string,
    options?: { weekId?: string | null; unassignedOnly?: boolean }
  ): Promise<EditorialSlot[]> {
    let query = supabase
      .from("editorial_calendar")
      .select("*")
      .order("item_order", { ascending: true })
      .order("scheduled_date", { ascending: true, nullsFirst: false })
      .order("scheduled_time", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (status) query = query.eq("status", status);
    if (options?.weekId) query = query.eq("week_id", options.weekId);
    if (options?.unassignedOnly) query = query.is("week_id", null);
    const { data, error } = await query;
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return ((data || []) as unknown[]).map(toSlot);
  }

  static async listByWeekIds(supabase: any, weekIds: string[]): Promise<EditorialSlot[]> {
    if (!weekIds.length) return [];
    const { data, error } = await supabase
      .from("editorial_calendar")
      .select("*")
      .in("week_id", weekIds)
      .order("item_order", { ascending: true })
      .order("scheduled_date", { ascending: true, nullsFirst: false })
      .order("scheduled_time", { ascending: true, nullsFirst: false });
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return ((data || []) as unknown[]).map(toSlot);
  }

  static async propose(supabase: any, slots: EditorialSlotInput[], weekId?: string) {
    if (!slots.length) throw new Error("EMPTY_CALENDAR: need at least 1 slot");
    if (slots.length > 12) throw new Error("CALENDAR_LIMIT: max 12 slots per proposal");
    const rows = slots.map((slot, index) =>
      slotRow(slot, { status: "proposed", week_id: weekId || null, item_order: index })
    );
    const { data, error } = await supabase.from("editorial_calendar").insert(rows).select("*");
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return ((data || []) as unknown[]).map(toSlot);
  }

  static async revise(supabase: any, id: string, patch: Partial<EditorialSlotInput>) {
    const current = await this.get(supabase, id);
    if (current.status !== "revision_requested") {
      throw new Error("INVALID_STATUS: slot can only be revised when status is revision_requested");
    }
    const { data, error } = await supabase
      .from("editorial_calendar")
      .update({
        ...mergedSlot(current, patch),
        status: "proposed",
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return toSlot(data);
  }

  static async upsertForWeek(supabase: any, weekId: string, slot: EditorialSlotInput) {
    if (slot.id) {
      const current = await this.get(supabase, slot.id);
      if (current.week_id !== weekId) {
        throw new Error("INVALID_SLOT: slot does not belong to this week");
      }
      if (current.status === "drafted" || current.status === "cancelled" || current.status === "writing") {
        throw new Error(`INVALID_STATUS: cannot revise a ${current.status} slot`);
      }
      const { data, error } = await supabase
        .from("editorial_calendar")
        .update({ ...slotRow(slot), status: "proposed", week_id: weekId })
        .eq("id", slot.id)
        .select("*")
        .single();
      if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
      return toSlot(data);
    }
    const created = await this.propose(supabase, [slot], weekId);
    return created[0];
  }

  static async setStatus(
    supabase: any,
    id: string,
    status: EditorialSlotStatus,
    adminFeedback?: string
  ) {
    const payload: Record<string, unknown> = { status };
    if (adminFeedback !== undefined) payload.admin_feedback = adminFeedback;
    const { data, error } = await supabase
      .from("editorial_calendar")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return toSlot(data);
  }

  static async adminUpdate(supabase: any, id: string, patch: Partial<EditorialSlotInput>) {
    const current = await this.get(supabase, id);
    if (current.status === "cancelled" || current.status === "drafted") {
      throw new Error("Không sửa được bài đã hủy hoặc đã có bản nháp");
    }
    if (current.week_id) await assertWeekNotApproved(supabase, current.week_id);
    const { data, error } = await supabase
      .from("editorial_calendar")
      .update(slotRow(mergedSlot(current, patch)))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return toSlot(data);
  }

  static async reorder(supabase: any, weekId: string, orderedIds: string[]) {
    await assertWeekNotApproved(supabase, weekId);
    if (!orderedIds.length) throw new Error("EMPTY_ORDER");
    const slots = await this.list(supabase, undefined, { weekId });
    const allowed = new Set(slots.map((slot) => slot.id));
    if (orderedIds.length !== slots.length || orderedIds.some((id) => !allowed.has(id))) {
      throw new Error("INVALID_ORDER: must include every slot in the week exactly once");
    }
    for (const [index, id] of orderedIds.entries()) {
      const { error } = await supabase
        .from("editorial_calendar")
        .update({ item_order: index })
        .eq("id", id)
        .eq("week_id", weekId);
      if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    }
    return this.list(supabase, undefined, { weekId });
  }

  static async approveMany(supabase: any, ids: string[]) {
    if (!ids.length) return [] as EditorialSlot[];
    const { data, error } = await supabase
      .from("editorial_calendar")
      .update({ status: "approved", admin_feedback: "" })
      .in("id", ids)
      .select("*");
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return ((data || []) as unknown[]).map(toSlot);
  }

  static async get(supabase: any, id: string) {
    const { data, error } = await supabase.from("editorial_calendar").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    if (!data) throw new Error("UNKNOWN_CALENDAR_ID");
    return toSlot(data);
  }

  static async claimForWriting(supabase: any, id: string) {
    const slot = await this.get(supabase, id);
    if (slot.week_id) {
      const { data: week, error } = await supabase
        .from("editorial_weeks")
        .select("status")
        .eq("id", slot.week_id)
        .maybeSingle();
      if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
      if (!week || week.status !== "approved") {
        throw new Error("WEEK_NOT_APPROVED: the weekly list must be approved before writing");
      }
    }
    if (slot.result_post_id) {
      throw new Error("USE_UPDATE_BLOG_DRAFT: this slot already has a draft");
    }
    if (slot.status !== "approved" && slot.status !== "writing") {
      throw new Error("CALENDAR_NOT_APPROVED: only approved slots can be written");
    }
    if (!isSlotDue(slot)) {
      throw new Error(
        `CALENDAR_NOT_DUE: slot is scheduled for ${slot.scheduled_date} ${slot.scheduled_time || "00:00"} ${EDITORIAL_TIMEZONE}`
      );
    }
    if (slot.status === "approved") {
      await supabase
        .from("editorial_calendar")
        .update({ write_attempts: (slot.write_attempts || 0) + 1 })
        .eq("id", id);
      return this.setStatus(supabase, id, "writing");
    }
    return slot;
  }

  static async releaseNow(supabase: any, id: string, now = new Date()) {
    const slot = await this.get(supabase, id);
    if (slot.status !== "approved" && slot.status !== "writing") {
      throw new Error("Chỉ mở viết sớm được slot đã duyệt");
    }
    const vietnam = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const date = vietnam.toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("editorial_calendar")
      .update({ scheduled_date: date, scheduled_time: "00:00" })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return toSlot(data);
  }

  static async reopen(supabase: any, id: string, restore?: { scheduled_date?: string | null; scheduled_time?: string | null }) {
    const slot = await this.get(supabase, id);
    if (slot.result_post_id) {
      throw new Error("Bài đã có bản nháp. Hãy dùng Trả bài cho ChatGPT, không hoàn về đầu được.");
    }
    if (slot.status !== "approved" && slot.status !== "writing") {
      throw new Error("Chỉ hoàn được bài đang duyệt hoặc đang mở viết, chưa có bản nháp");
    }
    const { data, error } = await supabase
      .from("editorial_calendar")
      .update({
        status: "proposed",
        admin_feedback: "",
        scheduled_date: restore?.scheduled_date ?? slot.scheduled_date,
        scheduled_time: restore?.scheduled_time ?? slot.scheduled_time,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return toSlot(data);
  }

  static async attachFreeWriteDraft(
    supabase: any,
    input: {
      postId: string;
      title: string;
      excerpt?: string | null;
      primary_keyword?: string | null;
      seoScore?: number | null;
    }
  ) {
    const existing = await this.getByPostId(supabase, input.postId);
    if (existing) return existing;
    const rows = [{
      title: input.title.trim() || "Bài viết tự do",
      outline: (input.excerpt || "Bài viết chế độ tự do").trim(),
      notes: "free_write",
      primary_keyword: input.primary_keyword?.trim() || null,
      why_this_article: "Bài viết chế độ tự do — không thuộc lịch tuần.",
      source_strategy: "Theo brief người dùng trong chat.",
      search_intent: "informational",
      status: "drafted",
      week_id: null,
      result_post_id: input.postId,
      last_seo_score: input.seoScore ?? null,
      item_order: 0,
    }];
    const { data, error } = await supabase.from("editorial_calendar").insert(rows).select("*").single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return toSlot(data);
  }

  static async markDrafted(supabase: any, id: string, postId: string, seoScore?: number | null) {
    const payload: Record<string, unknown> = {
      status: "drafted",
      result_post_id: postId,
      last_write_error: null,
    };
    if (seoScore != null) payload.last_seo_score = seoScore;
    const { data, error } = await supabase
      .from("editorial_calendar")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return toSlot(data);
  }

  static async markWriteFailed(supabase: any, id: string, message: string) {
    const slot = await this.get(supabase, id);
    const { data, error } = await supabase
      .from("editorial_calendar")
      .update({
        status: slot.result_post_id ? "revision_requested" : "approved",
        write_fails: (slot.write_fails || 0) + 1,
        last_write_error: message.slice(0, 500),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return toSlot(data);
  }

  static async markPublishedByPostId(supabase: any, postId: string) {
    const { data, error } = await supabase
      .from("editorial_calendar")
      .update({ status: "published" })
      .eq("result_post_id", postId)
      .select("*");
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return ((data || []) as unknown[]).map(toSlot);
  }

  static async getByPostId(supabase: any, postId: string) {
    const { data, error } = await supabase
      .from("editorial_calendar")
      .select("*")
      .eq("result_post_id", postId)
      .maybeSingle();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return data ? toSlot(data) : null;
  }

  static async listDue(supabase: any, now = new Date()): Promise<{
    timezone: string;
    now: string;
    due: EditorialSlot[];
    revise: EditorialSlot[];
    upcoming: EditorialSlot[];
    blocked: Array<EditorialSlot & { blocked_reason: string }>;
  }> {
    const writable = await this.list(supabase);
    const weekIds = [...new Set(writable.map((slot) => slot.week_id).filter(Boolean))] as string[];
    const weekStatus = new Map<string, string>();
    if (weekIds.length) {
      const { data, error } = await supabase.from("editorial_weeks").select("id, status").in("id", weekIds);
      if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
      for (const week of data || []) weekStatus.set(week.id, week.status);
    }
    const weekApproved = (slot: EditorialSlot) =>
      !slot.week_id || weekStatus.get(slot.week_id) === "approved";

    const blocked = writable
      .filter((slot) =>
        (slot.status === "approved" || slot.status === "writing") &&
        !slot.result_post_id &&
        isSlotDue(slot, now) &&
        !weekApproved(slot)
      )
      .map((slot) => ({
        ...slot,
        blocked_reason: "WEEK_NOT_APPROVED: admin must approve the whole weekly list before writing",
      }));

    const writeCandidates = writable.filter((slot) =>
      weekApproved(slot) &&
      (slot.status === "approved" || slot.status === "writing") &&
      !slot.result_post_id
    );
    const revise = writable.filter((slot) =>
      weekApproved(slot) &&
      slot.status === "revision_requested" &&
      Boolean(slot.result_post_id)
    );

    return {
      timezone: EDITORIAL_TIMEZONE,
      now: now.toISOString(),
      due: writeCandidates.filter((slot) => isSlotDue(slot, now)),
      revise,
      upcoming: writeCandidates.filter((slot) => !isSlotDue(slot, now)),
      blocked,
    };
  }

  static async markDueReminded(supabase: any, ids: string[], at = new Date()) {
    if (!ids.length) return;
    const { error } = await supabase
      .from("editorial_calendar")
      .update({ last_due_reminder_at: at.toISOString() })
      .in("id", ids);
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
  }
}

async function assertWeekNotApproved(supabase: any, weekId: string) {
  const { data, error } = await supabase
    .from("editorial_weeks")
    .select("status")
    .eq("id", weekId)
    .maybeSingle();
  if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
  if (data?.status === "approved") {
    throw new Error("PLAN_LOCKED: approved plans cannot be edited or revised");
  }
}
