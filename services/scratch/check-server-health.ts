import 'dotenv/config';
import mcp, { initMCPClient, closeMCPClient } from '../mcp-client.js';

async function main() {
  try {
    await initMCPClient();
    console.log('[Check] Đang kiểm tra trạng thái Server Health...');
    
    const result = await mcp.callTool('get_health', {});
    console.log('[Check] Trạng thái Health:', JSON.stringify(result, null, 2));

  } catch (error: any) {
    console.error('[Check] ❌ Lỗi:', error.message);
  } finally {
    await closeMCPClient();
  }
}

main();
