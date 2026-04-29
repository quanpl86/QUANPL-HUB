import fs from 'fs';
import path from 'path';
import { getSupabaseServer } from '@/lib/supabase-server';
import { generateEmbedding } from './embeddings';
import { getDriveFiles, getFileContent } from './google-drive';
import { getAutomationSettings } from '@/app/actions/automation';

/**
 * MCP Bridge Pro+: Semantic Vector Search (RAG)
 */

const KNOWLEDGE_DIR = path.join(process.cwd(), 'src/content/knowledge');

export async function queryInternalKnowledge(topic: string, selectedFiles: string[] = []) {
  console.log(`[MCP Pro+] Đang thực hiện Semantic Vector Search cho: ${topic}`);

  const supabase = await getSupabaseServer();
  const { data: settings } = await supabase.from('automation_settings').select('*');
  const GEMINI_KEY = settings?.find(s => s.key_name === 'GEMINI_API_KEY')?.key_value;

  try {
    // 1. Cố gắng sử dụng Vector Search (Pro RAG) nếu có API Key
    if (GEMINI_KEY) {
      const queryEmbedding = await generateEmbedding(topic, GEMINI_KEY);
      
      if (queryEmbedding) {
        const { data: matchedChunks, error } = await supabase.rpc('match_knowledge_chunks', {
          query_embedding: queryEmbedding,
          match_threshold: 0.3,
          match_count: 50
        });

        if (!error && matchedChunks && matchedChunks.length > 0) {
          let filteredChunks = matchedChunks;
          if (selectedFiles.length > 0) {
            filteredChunks = matchedChunks.filter((c: any) => selectedFiles.includes(c.source_file));
          }

          if (filteredChunks.length > 0) {
            console.log(`[MCP Pro+] Tìm thấy ${filteredChunks.length} đoạn tri thức tương đồng.`);
            return filteredChunks.slice(0, 5).map((c: any) => `--- Nguồn: ${c.source_file} (Similarity: ${Math.round(c.similarity * 100)}%) ---\n${c.content}`).join('\n\n');
          }
        }
      }
    }

    // 2. Fallback sang Weighted Keyword Search
    console.log(`[MCP Pro+] Đang sử dụng Keyword Search Fallback...`);
    
    let localFiles = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
    const keywords = topic.toLowerCase().split(' ').filter(w => w.length > 3);
    const chunks: { content: string, score: number, source: string }[] = [];

    // 2.1. Xử lý file Local
    const selectedLocalFiles = selectedFiles.filter(f => !f.startsWith('DRIVE:'));
    const targetLocalFiles = selectedLocalFiles.length > 0 ? localFiles.filter(f => selectedLocalFiles.includes(f)) : (selectedFiles.length === 0 ? localFiles : []);

    for (const file of targetLocalFiles) {
      const fullText = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf-8');
      const fileChunks = fullText.match(/[\s\S]{1,1000}/g) || [];
      for (const chunk of fileChunks) {
        let score = 0;
        const lowerChunk = chunk.toLowerCase();
        keywords.forEach(kw => { if (lowerChunk.includes(kw)) score += 10; });
        if (score > 0) chunks.push({ content: chunk, score, source: file });
      }
    }

    // 2.2. Xử lý file Drive (Truy vấn trực tiếp)
    const selectedDriveFiles = selectedFiles.filter(f => f.startsWith('DRIVE:'));
    if (selectedDriveFiles.length > 0) {
      const autoSettings = await getAutomationSettings();
      const DRIVE_KEY = autoSettings?.find((s: any) => s.key_name === 'GOOGLE_CLOUD_API_KEY')?.key_value;
      const FOLDER_ID = autoSettings?.find((s: any) => s.key_name === 'NOTEBOOK_OUTPUT_FOLDER_ID')?.key_value;

      if (DRIVE_KEY && FOLDER_ID) {
        const driveFilesList = await getDriveFiles(DRIVE_KEY, FOLDER_ID);
        for (const driveFile of selectedDriveFiles) {
          const fileName = driveFile.replace('DRIVE:', '');
          const fileMatch = driveFilesList.find((f: any) => f.name === fileName);
          
          if (fileMatch && fileMatch.id) {
            console.log(`[MCP Pro+] FETCH_DRIVE_CONTENT: ${fileName}`);
            const content = await getFileContent(fileMatch.id, DRIVE_KEY);
            const fileChunks = content.match(/[\s\S]{1,1500}/g) || [];
            for (const chunk of fileChunks) {
              let score = 0;
              const lowerChunk = chunk.toLowerCase();
              keywords.forEach(kw => { if (lowerChunk.includes(kw)) score += 10; });
              // Ưu tiên cao hơn cho file được chọn đích danh
              chunks.push({ content: chunk, score: score + 20, source: driveFile });
            }
          }
        }
      }
    }

    const bestChunks = chunks.sort((a, b) => b.score - a.score).slice(0, 10);
    return bestChunks.map(c => `--- Nguồn: ${c.source} (Keyword Score: ${c.score}) ---\n${c.content}`).join('\n\n');

  } catch (error: any) {
    console.error('Error in MCP Pro+:', error);
    return `Lỗi truy xuất tri thức: ${error.message}`;
  }
}
