import 'dotenv/config';
import { initMCPClient, generateAudio } from '../mcp-client.js';

async function run() {
  console.log('🚀 Bắt đầu chẩn đoán HTML của trang NotebookLM...');
  await initMCPClient();
  try {
    await generateAudio(process.env.NOTEBOOK_DEFAULT_ID);
  } catch (e) {
    console.log('⚠️ Kết quả gọi tool:', e.message);
  }
  console.log('✅ Hoàn tất việc lấy mã HTML!');
  process.exit(0);
}

run();
