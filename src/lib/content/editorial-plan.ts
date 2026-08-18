export type SlotLike = {
  id?: string;
  title?: string;
  angle?: string | null;
  audience?: string | null;
  goal?: string | null;
  outline?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  field?: string | null;
  subject?: string | null;
  category?: string | null;
  tags?: string[];
  search_intent?: string | null;
  primary_keyword?: string | null;
  secondary_keywords?: string[];
  why_this_article?: string | null;
  source_strategy?: string | null;
  article_objectives?: string[];
  item_order?: number;
  target_audience?: string;
  content_angle?: string;
};

export type RevisionConstraints = {
  keep_schedule: boolean;
  keep_category: boolean;
  keep_cluster: boolean;
  keep_keyword: boolean;
  allow_title_change: boolean;
  allow_angle_change: boolean;
};

export const DEFAULT_REVISION_CONSTRAINTS: RevisionConstraints = {
  keep_schedule: true,
  keep_category: true,
  keep_cluster: true,
  keep_keyword: true,
  allow_title_change: true,
  allow_angle_change: true,
};

export type InternalLinkSuggestion = {
  post_id?: string;
  slug?: string;
  title?: string;
  reason?: string;
};

export type PlanRevision = {
  id: string;
  week_id: string;
  revision_number: number;
  snapshot: Record<string, unknown>;
  author: "admin" | "chatgpt";
  note: string | null;
  created_at: string;
};

export type EditorialActivity = {
  id: string;
  week_id: string;
  slot_id: string | null;
  event: string;
  actor: "admin" | "chatgpt" | "system";
  payload: Record<string, unknown>;
  created_at: string;
};

export type FieldDiff = {
  path: string;
  before: string;
  after: string;
};

export function parseConstraints(value: unknown): RevisionConstraints {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    keep_schedule: raw.keep_schedule !== false,
    keep_category: raw.keep_category !== false,
    keep_cluster: raw.keep_cluster !== false,
    keep_keyword: raw.keep_keyword !== false,
    allow_title_change: raw.allow_title_change !== false,
    allow_angle_change: raw.allow_angle_change !== false,
  };
}

export function applySlotAliases<T extends SlotLike>(slot: T): T & { audience?: string; angle?: string } {
  return {
    ...slot,
    audience: slot.audience || slot.target_audience,
    angle: slot.angle || slot.content_angle,
  };
}

function asStringList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, max);
}

export function asLinkSuggestions(value: unknown): InternalLinkSuggestion[] {
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

export function assertPlanUnlocked(status: string) {
  if (status === "approved") throw new Error("PLAN_LOCKED: approved plans cannot be edited or revised");
}

export function assertRevisionBase(currentRevision: number, basedOnRevision: unknown) {
  const basedOn = Number(basedOnRevision);
  if (!Number.isInteger(basedOn)) {
    throw new Error("REVISION_CONFLICT: based_on_revision is required");
  }
  if (basedOn !== currentRevision) {
    throw new Error(
      `REVISION_CONFLICT: based_on_revision=${basedOn} but current revision is ${currentRevision}`
    );
  }
}

export function assertRichWeeklySlots(slots: SlotLike[]) {
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

export function enforceRevisionConstraints(
  currentSlots: SlotLike[],
  nextSlots: SlotLike[],
  constraints: RevisionConstraints
) {
  const byId = new Map(currentSlots.map((slot) => [slot.id, slot]));
  for (const raw of nextSlots) {
    const next = applySlotAliases(raw);
    if (!next.id) continue;
    const prev = byId.get(next.id);
    if (!prev) continue;

    if (constraints.keep_schedule) {
      const nextDate = String(next.scheduled_date ?? prev.scheduled_date ?? "");
      const nextTime = String(next.scheduled_time ?? prev.scheduled_time ?? "").slice(0, 5);
      if (nextDate !== String(prev.scheduled_date ?? "")) throw new Error("CONSTRAINT_VIOLATION: scheduled_date");
      if (nextTime !== String(prev.scheduled_time ?? "").slice(0, 5)) {
        throw new Error("CONSTRAINT_VIOLATION: scheduled_time");
      }
    }
    if (constraints.keep_category) {
      const nextCategory = next.category ?? prev.category ?? "";
      if (nextCategory !== (prev.category || "")) throw new Error("CONSTRAINT_VIOLATION: category");
    }
    if (constraints.keep_cluster) {
      if ((next.field ?? prev.field ?? "") !== (prev.field || "")) {
        throw new Error("CONSTRAINT_VIOLATION: field");
      }
      if ((next.subject ?? prev.subject ?? "") !== (prev.subject || "")) {
        throw new Error("CONSTRAINT_VIOLATION: subject");
      }
    }
    if (constraints.keep_keyword) {
      if ((next.primary_keyword ?? prev.primary_keyword ?? "") !== (prev.primary_keyword || "")) {
        throw new Error("CONSTRAINT_VIOLATION: primary_keyword");
      }
    }
    if (!constraints.allow_title_change && (next.title ?? prev.title) !== prev.title) {
      throw new Error("CONSTRAINT_VIOLATION: title");
    }
    if (!constraints.allow_angle_change && (next.angle ?? prev.angle ?? "") !== (prev.angle || "")) {
      throw new Error("CONSTRAINT_VIOLATION: angle");
    }
  }
}

export function snapshotSlots(slots: SlotLike[]) {
  return slots.map((slot) => ({
    id: slot.id,
    title: slot.title,
    angle: slot.angle,
    audience: slot.audience,
    goal: slot.goal,
    outline: slot.outline,
    scheduled_date: slot.scheduled_date,
    scheduled_time: slot.scheduled_time,
    field: slot.field,
    subject: slot.subject,
    category: slot.category,
    tags: slot.tags,
    search_intent: slot.search_intent,
    primary_keyword: slot.primary_keyword,
    secondary_keywords: slot.secondary_keywords,
    why_this_article: slot.why_this_article,
    source_strategy: slot.source_strategy,
    article_objectives: slot.article_objectives,
    item_order: slot.item_order,
  }));
}

export function diffSnapshots(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): FieldDiff[] {
  if (!before || !after) return [];
  const diffs: FieldDiff[] = [];
  const weekFields = ["title", "summary", "week_start"] as const;
  for (const field of weekFields) {
    const left = String(before[field] ?? "");
    const right = String(after[field] ?? "");
    if (left !== right) diffs.push({ path: field, before: left, after: right });
  }
  const beforeSlots = Array.isArray(before.slots) ? before.slots as Record<string, unknown>[] : [];
  const afterSlots = Array.isArray(after.slots) ? after.slots as Record<string, unknown>[] : [];
  const afterById = new Map(afterSlots.map((slot) => [String(slot.id || ""), slot]));
  const slotFields = [
    "title",
    "angle",
    "audience",
    "goal",
    "outline",
    "scheduled_date",
    "scheduled_time",
    "field",
    "subject",
    "category",
    "primary_keyword",
    "search_intent",
    "why_this_article",
    "source_strategy",
  ];
  for (const prev of beforeSlots) {
    const id = String(prev.id || "");
    const next = afterById.get(id);
    if (!next) {
      diffs.push({ path: `slot.${id}`, before: String(prev.title || id), after: "(removed)" });
      continue;
    }
    for (const field of slotFields) {
      const left = String(prev[field] ?? "");
      const right = String(next[field] ?? "");
      if (left !== right) diffs.push({ path: `slot.${id}.${field}`, before: left, after: right });
    }
  }
  return diffs;
}

export function isoWeekLabel(monday: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(monday);
  if (!match) return monday;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() + 3);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function asStringListField(value: unknown, max = 8): string[] {
  return asStringList(value, max);
}

export class EditorialPlanAudit {
  static async saveRevision(
    supabase: any,
    weekId: string,
    revisionNumber: number,
    snapshot: Record<string, unknown>,
    author: "admin" | "chatgpt",
    note?: string
  ) {
    const { error } = await supabase.from("editorial_plan_revisions").insert({
      week_id: weekId,
      revision_number: revisionNumber,
      snapshot,
      author,
      note: note || null,
    });
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
  }

  static async log(
    supabase: any,
    input: {
      week_id: string;
      slot_id?: string | null;
      event: string;
      actor: "admin" | "chatgpt" | "system";
      payload?: Record<string, unknown>;
    }
  ) {
    const { error } = await supabase.from("editorial_activity").insert({
      week_id: input.week_id,
      slot_id: input.slot_id || null,
      event: input.event,
      actor: input.actor,
      payload: input.payload || {},
    });
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
  }

  static async listRevisions(supabase: any, weekId: string): Promise<PlanRevision[]> {
    const { data, error } = await supabase
      .from("editorial_plan_revisions")
      .select("*")
      .eq("week_id", weekId)
      .order("revision_number", { ascending: false })
      .limit(20);
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return ((data || []) as any[]).map((row) => ({
      id: row.id,
      week_id: row.week_id,
      revision_number: Number(row.revision_number),
      snapshot: row.snapshot || {},
      author: row.author,
      note: row.note,
      created_at: row.created_at,
    }));
  }

  static async listActivity(supabase: any, weekId: string, limit = 20): Promise<EditorialActivity[]> {
    const { data, error } = await supabase
      .from("editorial_activity")
      .select("*")
      .eq("week_id", weekId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return ((data || []) as any[]).map((row) => ({
      id: row.id,
      week_id: row.week_id,
      slot_id: row.slot_id || null,
      event: row.event,
      actor: row.actor,
      payload: row.payload || {},
      created_at: row.created_at,
    }));
  }
}
