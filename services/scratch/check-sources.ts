import 'dotenv/config';
import mcp, { initMCPClient, closeMCPClient } from '../mcp-client.js';

async function main() {
  try {
    await initMCPClient();
    const notebookId = '4fab87d9-78ac-460d-9b23-822574fa959d';
    console.log(`[Check] Đang kiểm tra nguồn dữ liệu của Notebook: ${notebookId}`);
    
    const result = await mcp.callTool('list_sources', { notebook_id: notebookId });
    console.log('[Check] Danh sách nguồn:', JSON.stringify(result, null, 2));

  } catch (error: any) {
    console.error('[Check] ❌ Lỗi:', error.message);
  } finally {
    await closeMCPClient();
  }
}

main();
