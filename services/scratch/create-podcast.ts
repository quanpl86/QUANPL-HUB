import 'dotenv/config';
import { generateAudio, getAudioStatus } from './mcp-client.js';

async function main() {
  const notebookId = '4ae8fe58-b432-416f-8f9d-8b8b601fa6bd'; // Thay bằng ID Notebook của bạn
  console.log(`🎙️ Đang yêu cầu NotebookLM tạo Podcast cho Notebook: ${notebookId}`);

  try {
    const result = await generateAudio(notebookId);
    console.log('✅ Yêu cầu thành công! AI đang bắt đầu thu âm...');
    console.log('⏳ Quá trình này có thể mất từ 5-15 phút. Bạn có thể theo dõi trạng thái trên NotebookLM.');
  } catch (error: any) {
    console.error('❌ Lỗi khi tạo Podcast:', error.message);
  }
}

main();
