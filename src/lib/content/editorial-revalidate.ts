import { revalidatePath } from "next/cache";

/** Bust admin views after ChatGPT MCP writes. Open tabs still need Tải lại / refresh. */
export function revalidateEditorialSurfaces(postId?: string | null) {
  revalidatePath("/admin/editorial");
  revalidatePath("/admin/content-schedule");
  revalidatePath("/admin/posts");
  if (postId) revalidatePath(`/admin/posts/edit/${postId}`);
}
