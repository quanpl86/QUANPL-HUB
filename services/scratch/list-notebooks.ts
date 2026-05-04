import 'dotenv/config';
import mcp, { initMCPClient, closeMCPClient } from '../mcp-client.js';

async function main() {
  try {
    await initMCPClient();
    console.log('[List] Đang liệt kê notebooks...');
    const result = await mcp.listNotebooks();
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('[List] ❌ Lỗi:', error.message);
  } finally {
    await closeMCPClient();
  }
}

main();
