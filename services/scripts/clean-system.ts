import fs from 'fs';
import path from 'path';
import { supabase } from '../supabase-client.js';

async function main() {
  console.log('🧹 Đang dọn dẹp hệ thống kẹt...');

  // 1. Xóa các file .lock của MCP
  const lockDir = '/Users/mac/Library/Application Support/notebooklm-mcp';
  const lockFiles = ['.context-creation.lock', '.browser-launch.lock'];
  
  for (const file of lockFiles) {
    const lockPath = path.join(lockDir, file);
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
      console.log(`✅ Đã xóa file khóa: ${file}`);
    }
  }

  // 2. Reset các Task bị kẹt (processing quá 5 phút)
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('content_tasks')
    .update({ 
      status: 'pending', 
      logs: 'Tự động Reset do hệ thống kẹt.' 
    })
    .eq('status', 'processing')
    .lt('updated_at', fiveMinsAgo);

  if (error) {
    console.error('❌ Lỗi Reset Task:', error.message);
  } else {
    console.log('✅ Đã giải phóng các Task bị kẹt.');
  }
  
  console.log('🚀 Hệ thống đã sẵn sàng! Bạn hãy chạy lại: npm run dev');
}

main();
