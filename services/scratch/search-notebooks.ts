import 'dotenv/config';
import mcp, { initMCPClient, closeMCPClient } from '../mcp-client.js';

async function main() {
  try {
    await initMCPClient();
    console.log('[Search] Đang tìm kiếm notebooks liên quan đến "Robot"...');
    // search_notebooks là tool, ta gọi qua callTool
    const result = await mcp.callTool('search_notebooks', { query: 'Robot' });
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('[Search] ❌ Lỗi:', error.message);
  } finally {
    await closeMCPClient();
  }
}

main();
