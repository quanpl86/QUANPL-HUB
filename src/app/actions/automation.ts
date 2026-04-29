'use server';

import { getSupabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { checkAdmin } from '@/lib/auth-utils';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { getDriveFiles, getFileContent } from '@/lib/ai/google-drive';

/**
 * Lấy toàn bộ cấu hình tự động hóa
 */
export async function getAutomationSettings() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('automation_settings')
    .select('*')
    .order('key_name', { ascending: true });
    
  if (error) {
    console.error('Error fetching automation settings:', error);
    return [];
  }
  return data;
}

/**
 * Cập nhật cấu hình
 */
export async function updateAutomationSetting(key: string, value: string) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  
  const { error } = await supabase
    .from('automation_settings')
    .upsert({ key_name: key, key_value: value }, { onConflict: 'key_name' });

  if (error) {
    console.error('Error updating automation setting:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/automation');
  return { success: true };
}

/**
 * Lấy danh sách logs tự động hóa
 */
export async function getAutomationLogs(limit = 20) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('automation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching automation logs:', error);
    return [];
  }
  return data;
}

/**
 * Tạo log mới
 */
export async function createAutomationLog(stage: string, level: string, message: string, metadata: any = {}) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('automation_logs')
    .insert([{ stage, level, message, metadata }]);

  if (error) {
    console.error('Error creating automation log:', error);
  }
}

/**
 * Lấy danh sách tài liệu từ MCP Hub nội bộ
 */
export async function getMCPKnowledgeFiles() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  
  const fs = require('fs');
  const path = require('path');
  const knowledgeDir = path.join(process.cwd(), 'src/content/knowledge');
  
  try {
    if (!fs.existsSync(knowledgeDir)) return [];
    return fs.readdirSync(knowledgeDir).filter((f: string) => f.endsWith('.md') || f.endsWith('.txt'));
  } catch (error) {
    console.error('Error listing MCP files:', error);
    return [];
  }
}

/**
 * Đồng bộ hóa tri thức MCP sang Vector Database (Pro RAG)
 */
export async function syncVectorKnowledge() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  
  const fs = require('fs');
  const path = require('path');
  const knowledgeDir = path.join(process.cwd(), 'src/content/knowledge');
  
  const { data: settings } = await supabase.from('automation_settings').select('*');
  const GEMINI_KEY = settings?.find(s => s.key_name === 'GEMINI_API_KEY')?.key_value;

  if (!GEMINI_KEY) return { success: false, error: 'Thiếu GEMINI_API_KEY' };

  try {
    if (!fs.existsSync(knowledgeDir)) return { success: false, error: 'Thư mục tri thức không tồn tại' };
    const files = fs.readdirSync(knowledgeDir).filter((f: string) => f.endsWith('.md') || f.endsWith('.txt'));
    
    // Xóa dữ liệu cũ trước khi sync (tùy chọn)
    await supabase.from('knowledge_chunks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    for (const file of files) {
      const content = fs.readFileSync(path.join(knowledgeDir, file), 'utf-8');
      const chunks = content.match(/[\s\S]{1,1000}/g) || [];
      
      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk, GEMINI_KEY);
        await supabase.from('knowledge_chunks').insert([{
          content: chunk,
          embedding,
          source_file: file
        }]);
      }
    }

    return { success: true, count: files.length };
  } catch (error: any) {
    console.error('Vector Sync Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Đồng bộ hóa tri thức từ Google Drive (NotebookLM Output) sang Vector Database
 */
export async function syncDriveKnowledge() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  
  const { data: settings } = await supabase.from('automation_settings').select('*');
  const GEMINI_KEY = settings?.find(s => s.key_name === 'GEMINI_API_KEY')?.key_value;
  const DRIVE_KEY = settings?.find(s => s.key_name === 'GOOGLE_CLOUD_API_KEY')?.key_value;
  const FOLDER_ID = settings?.find(s => s.key_name === 'NOTEBOOK_OUTPUT_FOLDER_ID')?.key_value;

  if (!DRIVE_KEY || !FOLDER_ID || !GEMINI_KEY) {
    return { success: false, error: 'Thiếu cấu hình Drive API Key hoặc Folder ID hoặc Gemini Key' };
  }

  try {
    const files = await getDriveFiles(DRIVE_KEY, FOLDER_ID);
    let syncedCount = 0;

    for (const file of files) {
      if (file.id) {
        const content = await getFileContent(file.id, DRIVE_KEY);
        const chunks = content.match(/[\s\S]{1,1500}/g) || [];
        
        for (const chunk of chunks) {
          const embedding = await generateEmbedding(chunk, GEMINI_KEY);
          
          if (!embedding) {
            return { 
              success: false, 
              error: 'Dịch vụ Embedding không khả dụng (Lỗi 404). Hãy kiểm tra lại API Key hoặc quyền hạn của dự án.' 
            };
          }

          await supabase.from('knowledge_chunks').insert([{
            content: chunk,
            embedding,
            source_file: `DRIVE:${file.name}`,
            metadata: { fileId: file.id, source: 'google_drive' }
          }]);
        }
        syncedCount++;
      }
    }

    return { success: true, count: syncedCount };
  } catch (error: any) {
    console.error('Drive Sync Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Lấy danh sách file thực tế từ Google Drive để hiển thị lên Dashboard
 */
export async function getDriveKnowledgeFiles() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  
  const { data: settings } = await supabase.from('automation_settings').select('*');
  const DRIVE_KEY = settings?.find(s => s.key_name === 'GOOGLE_CLOUD_API_KEY')?.key_value;
  const FOLDER_ID = settings?.find(s => s.key_name === 'NOTEBOOK_OUTPUT_FOLDER_ID')?.key_value;

  if (!DRIVE_KEY || !FOLDER_ID) {
    return { success: false, error: 'Thiếu cấu hình Drive API Key hoặc Folder ID' };
  }

  try {
    const files = await getDriveFiles(DRIVE_KEY, FOLDER_ID);
    return { success: true, files };
  } catch (error: any) {
    console.error('Drive Fetch Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Lấy danh sách các nút MCP từ cơ sở dữ liệu
 */
export async function getMCPNodes() {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('automation_mcp_nodes')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching MCP nodes:', error);
    return [];
  }
  return data;
}
