'use server';

import { checkAdmin } from '@/lib/auth-utils';
import { getSupabaseAdmin } from '@/lib/supabase';

type UploadProvider = 'supabase' | 'github';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const allowedImageTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

function slugFileName(name: string) {
  const extension = name.split('.').pop()?.toLowerCase() || 'png';
  const base = name
    .replace(/\.[^/.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);

  return `${base || 'asset'}-${Date.now()}.${extension}`;
}

async function uploadToSupabase(file: File, buffer: ArrayBuffer) {
  const supabase = getSupabaseAdmin();
  const bucket = process.env.SUPABASE_EDITOR_ASSET_BUCKET || 'post-assets';
  const now = new Date();
  const filePath = [
    'editor',
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0'),
    slugFileName(file.name),
  ].join('/');

  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((item) => item.name === bucket);

  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: MAX_IMAGE_SIZE,
      allowedMimeTypes: Array.from(allowedImageTypes),
    });

    if (createError) {
      return { success: false, error: createError.message };
    }
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) return { success: false, error: error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { success: true, url: data.publicUrl, path: filePath, provider: 'supabase' as const };
}

async function uploadToGithub(file: File, buffer: ArrayBuffer) {
  const token = process.env.GITHUB_ASSET_TOKEN;
  const repo = process.env.GITHUB_ASSET_REPO;
  const branch = process.env.GITHUB_ASSET_BRANCH || 'main';
  const basePath = process.env.GITHUB_ASSET_PATH || 'public/editor-assets';

  if (!token || !repo) {
    return {
      success: false,
      error: 'Thiếu GITHUB_ASSET_TOKEN hoặc GITHUB_ASSET_REPO để upload ảnh lên GitHub.',
    };
  }

  const bytes = Buffer.from(buffer);
  const filePath = `${basePath.replace(/\/$/, '')}/${slugFileName(file.name)}`;
  const endpoint = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Add editor asset ${file.name}`,
      content: bytes.toString('base64'),
      branch,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return { success: false, error: `GitHub upload failed: ${detail}` };
  }

  const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`;
  return { success: true, url: rawUrl, path: filePath, provider: 'github' as const };
}

export async function uploadEditorAsset(formData: FormData) {
  if (!await checkAdmin()) throw new Error('Unauthorized');

  const file = formData.get('file');
  const provider = (formData.get('provider') || 'supabase') as UploadProvider;

  if (!(file instanceof File)) {
    return { success: false, error: 'Không tìm thấy file ảnh hợp lệ.' };
  }

  if (!allowedImageTypes.has(file.type)) {
    return { success: false, error: 'Định dạng ảnh chưa được hỗ trợ.' };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { success: false, error: 'Ảnh vượt quá giới hạn 10MB.' };
  }

  const buffer = await file.arrayBuffer();

  if (provider === 'github') {
    return uploadToGithub(file, buffer);
  }

  return uploadToSupabase(file, buffer);
}
