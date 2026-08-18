export type EditorialCommentAuthor = "admin" | "chatgpt";

export type EditorialComment = {
  id: string;
  week_id: string;
  slot_id: string | null;
  author: EditorialCommentAuthor;
  body: string;
  created_at: string;
};

export type EditorialCommentInput = {
  week_id: string;
  slot_id?: string | null;
  author: EditorialCommentAuthor;
  body: string;
};

function toComment(row: any): EditorialComment {
  return {
    id: row.id,
    week_id: row.week_id,
    slot_id: row.slot_id || null,
    author: row.author,
    body: row.body,
    created_at: row.created_at,
  };
}

export class EditorialCommentRepository {
  static async listForWeeks(supabase: any, weekIds: string[]): Promise<EditorialComment[]> {
    if (!weekIds.length) return [];
    const { data, error } = await supabase
      .from("editorial_review_comments")
      .select("*")
      .in("week_id", weekIds)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return ((data || []) as unknown[]).map(toComment);
  }

  static async add(supabase: any, input: EditorialCommentInput): Promise<EditorialComment> {
    const body = input.body?.trim() || "";
    if (!body) throw new Error("EMPTY_COMMENT: comment body is required");
    if (body.length > 4000) throw new Error("COMMENT_TOO_LONG: max 4000 characters");
    if (!input.week_id) throw new Error("INVALID_COMMENT: week_id is required");
    const { data, error } = await supabase
      .from("editorial_review_comments")
      .insert({
        week_id: input.week_id,
        slot_id: input.slot_id || null,
        author: input.author,
        body,
      })
      .select("*")
      .single();
    if (error) throw new Error(`DATABASE_ERROR: ${error.message}`);
    return toComment(data);
  }
}
