import 'dotenv/config';
import mcp, { initMCPClient, closeMCPClient } from '../mcp-client.js';

async function main() {
  try {
    await initMCPClient();
    console.log('[Sync] Đang bắt đầu đồng bộ thư viện (Timeout: 5 phút)...');
    
    // Gọi sync_library với timeout lớn
    const result = await mcp.callTool('sync_library', {}, 300000);
    console.log('[Sync] Kết quả:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('[List] Thử liệt kê lại:');
    const notebooks = await mcp.listNotebooks();
    console.log(JSON.stringify(notebooks, null, 2));

  } catch (error: any) {
    console.error('[Sync] ❌ Lỗi:', error.message);
  } finally {
    await closeMCPClient();
  }
}

main();
