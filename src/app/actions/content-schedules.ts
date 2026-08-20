'use server';

import { revalidatePath } from 'next/cache';
import { checkAdmin } from '@/lib/auth-utils';
import { getSupabaseServer } from '@/lib/supabase-server';

export type ContentScheduleStatus = 'draft' | 'in_progress' | 'done';

export type ContentScheduleItem = {
  id: string;
  order: number;
  title: string;
  slug: string;
  previousContext: string;
  description: string;
  goal: string;
  audience: string;
  status: ContentScheduleStatus;
  scheduledDate: string;
  createdAt: string;
  promptRule?: string;
  promptBrief?: string;
  promptContext?: string;
  promptInstructionId?: string;
  sourcePlan?: string;
};

export type ContentInstruction = {
  id: string;
  name: string;
  description: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ContentReferencePost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
};

export type ContentScheduleInput = Omit<ContentScheduleItem, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: string;
};

type ContentScheduleRow = {
  id: string;
  item_order: number;
  title: string;
  slug: string;
  previous_context: string | null;
  description: string | null;
  goal: string | null;
  audience: string | null;
  status: ContentScheduleStatus;
  scheduled_date: string | null;
  created_at: string;
  prompt_rule: string | null;
  prompt_brief: string | null;
  prompt_context: string | null;
  prompt_instruction_id: string | null;
  source_plan: string | null;
};

type ContentInstructionRow = {
  id: string;
  name: string;
  description: string | null;
  content: string;
  is_default: boolean | null;
  created_at: string;
  updated_at: string;
};

type ContentReferencePostRow = {
  id: string;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  is_published: boolean | null;
  updated_at: string | null;
  created_at: string | null;
};

function toItem(row: ContentScheduleRow): ContentScheduleItem {
  return {
    id: row.id,
    order: row.item_order,
    title: row.title,
    slug: row.slug,
    previousContext: row.previous_context || '',
    description: row.description || '',
    goal: row.goal || '',
    audience: row.audience || '',
    status: row.status,
    scheduledDate: row.scheduled_date || '',
    createdAt: row.created_at,
    promptRule: row.prompt_rule || '',
    promptBrief: row.prompt_brief || '',
    promptContext: row.prompt_context || '',
    promptInstructionId: row.prompt_instruction_id || '',
    sourcePlan: row.source_plan || '',
  };
}

function toInstruction(row: ContentInstructionRow): ContentInstruction {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    content: row.content,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInsertPayload(item: ContentScheduleInput, userId?: string) {
  return {
    item_order: item.order,
    title: item.title,
    slug: item.slug,
    previous_context: item.previousContext || null,
    description: item.description || null,
    goal: item.goal || null,
    audience: item.audience || null,
    status: item.status,
    scheduled_date: item.scheduledDate || null,
    prompt_rule: item.promptRule || null,
    prompt_brief: item.promptBrief || null,
    prompt_context: item.promptContext || null,
    prompt_instruction_id: item.promptInstructionId || null,
    source_plan: item.sourcePlan || null,
    created_by: userId || null,
  };
}

async function requireAdminSupabase() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getContentScheduleState() {
  if (!await checkAdmin()) {
    return {
      success: false,
      items: [] as ContentScheduleItem[],
      previousArticleContent: '',
      instructions: [] as ContentInstruction[],
      referencePosts: [] as ContentReferencePost[],
      error: 'Unauthorized',
    };
  }

  const supabase = await getSupabaseServer();

  const [
    { data: rows, error: itemsError },
    { data: settings, error: settingsError },
    { data: instructionRows, error: instructionsError },
    { data: referenceRows, error: referencePostsError },
  ] = await Promise.all([
    supabase
      .from('content_schedules')
      .select('*')
      .order('scheduled_date', { ascending: true })
      .order('item_order', { ascending: true }),
    supabase
      .from('content_schedule_settings')
      .select('previous_article_content')
      .eq('id', 1)
      .maybeSingle(),
    supabase
      .from('content_instructions')
      .select('*')
      .or('instruction_type.is.null,instruction_type.neq.ARTICLE_WORKFLOW')
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false }),
    supabase
      .from('posts')
      .select('id, title, slug, excerpt, content, is_published, updated_at, created_at')
      .order('updated_at', { ascending: false })
      .limit(80),
  ]);

  if (itemsError) {
    console.error('Error loading content schedules:', itemsError);
    return {
      success: false,
      items: [] as ContentScheduleItem[],
      previousArticleContent: '',
      instructions: [] as ContentInstruction[],
      error: itemsError.message,
      referencePosts: [] as ContentReferencePost[],
    };
  }

  if (settingsError) {
    console.error('Error loading content schedule settings:', settingsError);
  }

  if (instructionsError) {
    console.error('Error loading content instructions:', instructionsError);
  }

  if (referencePostsError) {
    console.error('Error loading reference posts:', referencePostsError);
  }

  return {
    success: true,
    items: ((rows || []) as ContentScheduleRow[]).map(toItem),
    previousArticleContent: settings?.previous_article_content || '',
    instructions: ((instructionRows || []) as ContentInstructionRow[]).map(toInstruction),
    referencePosts: ((referenceRows || []) as ContentReferencePostRow[]).map((post) => ({
      id: post.id,
      title: post.title || 'Chưa có tiêu đề',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      isPublished: Boolean(post.is_published),
      updatedAt: post.updated_at || post.created_at || '',
    })) as ContentReferencePost[],
  };
}

export async function createContentSchedules(items: ContentScheduleInput[]) {
  const { supabase, user } = await requireAdminSupabase();

  const { data, error } = await supabase
    .from('content_schedules')
    .insert(items.map((item) => toInsertPayload(item, user?.id)))
    .select('*')
    .order('scheduled_date', { ascending: true })
    .order('item_order', { ascending: true });

  if (error) {
    console.error('Error creating content schedules:', error);
    return { success: false, items: [] as ContentScheduleItem[], error: error.message };
  }

  revalidatePath('/admin/content-schedule');
  return { success: true, items: ((data || []) as ContentScheduleRow[]).map(toItem) };
}

export async function createContentSchedule(item: ContentScheduleInput) {
  const { supabase, user } = await requireAdminSupabase();

  const { data, error } = await supabase
    .from('content_schedules')
    .insert([toInsertPayload(item, user?.id)])
    .select('*')
    .single();

  if (error) {
    console.error('Error creating content schedule:', error);
    return { success: false, item: null, error: error.message };
  }

  revalidatePath('/admin/content-schedule');
  return { success: true, item: toItem(data as ContentScheduleRow) };
}

export async function updateContentScheduleStatus(id: string, status: ContentScheduleStatus) {
  const { supabase } = await requireAdminSupabase();

  const { error } = await supabase
    .from('content_schedules')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating content schedule status:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/content-schedule');
  return { success: true };
}

export async function updateContentScheduleDate(id: string, scheduledDate: string) {
  const { supabase } = await requireAdminSupabase();

  const { error } = await supabase
    .from('content_schedules')
    .update({ scheduled_date: scheduledDate || null })
    .eq('id', id);

  if (error) {
    console.error('Error updating content schedule date:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/content-schedule');
  return { success: true };
}

export async function updateContentSchedulePrompt(
  id: string,
  promptData: { promptRule: string; promptBrief: string; promptContext: string; promptInstructionId?: string }
) {
  const { supabase } = await requireAdminSupabase();

  const { error } = await supabase
    .from('content_schedules')
    .update({
      prompt_rule: promptData.promptRule || null,
      prompt_brief: promptData.promptBrief || null,
      prompt_context: promptData.promptContext || null,
      prompt_instruction_id: promptData.promptInstructionId || null,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating content schedule prompt:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/content-schedule');
  return { success: true };
}

export async function createContentInstruction(input: {
  name: string;
  description?: string;
  content: string;
  isDefault?: boolean;
}) {
  const { supabase, user } = await requireAdminSupabase();

  if (input.isDefault) {
    await supabase.from('content_instructions').update({ is_default: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  }

  const { data, error } = await supabase
    .from('content_instructions')
    .insert([{
      name: input.name,
      description: input.description || null,
      content: input.content,
      is_default: input.isDefault ?? false,
      created_by: user?.id || null,
      updated_by: user?.id || null,
    }])
    .select('*')
    .single();

  if (error) {
    console.error('Error creating content instruction:', error);
    return { success: false, instruction: null, error: error.message };
  }

  revalidatePath('/admin/content-schedule');
  return { success: true, instruction: toInstruction(data as ContentInstructionRow) };
}

export async function updateContentInstruction(
  id: string,
  input: { name: string; description?: string; content: string; isDefault?: boolean }
) {
  const { supabase, user } = await requireAdminSupabase();

  if (input.isDefault) {
    await supabase.from('content_instructions').update({ is_default: false }).neq('id', id);
  }

  const { data, error } = await supabase
    .from('content_instructions')
    .update({
      name: input.name,
      description: input.description || null,
      content: input.content,
      is_default: input.isDefault ?? false,
      updated_by: user?.id || null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating content instruction:', error);
    return { success: false, instruction: null, error: error.message };
  }

  revalidatePath('/admin/content-schedule');
  return { success: true, instruction: toInstruction(data as ContentInstructionRow) };
}

export async function deleteContentInstruction(id: string) {
  const { supabase } = await requireAdminSupabase();

  const { error } = await supabase
    .from('content_instructions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting content instruction:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/content-schedule');
  return { success: true };
}

export async function deleteContentSchedule(id: string) {
  const { supabase } = await requireAdminSupabase();

  const { error } = await supabase
    .from('content_schedules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting content schedule:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/content-schedule');
  return { success: true };
}

export async function clearContentSchedules() {
  const { supabase } = await requireAdminSupabase();

  const { error } = await supabase
    .from('content_schedules')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error clearing content schedules:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/content-schedule');
  return { success: true };
}

export async function updateContentSchedulePreviousContext(previousArticleContent: string) {
  const { supabase, user } = await requireAdminSupabase();

  const { error } = await supabase
    .from('content_schedule_settings')
    .upsert({
      id: 1,
      previous_article_content: previousArticleContent,
      updated_by: user?.id || null,
    });

  if (error) {
    console.error('Error updating content schedule previous context:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/content-schedule');
  return { success: true };
}
