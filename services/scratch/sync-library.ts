import 'dotenv/config';
import mcp, { initMCPClient, closeMCPClient } from '../mcp-client.js';

async function main() {
  try {
    console.log('[Sync] Khởi tạo MCP Client...');
    await initMCPClient();
    
    console.log('[Sync] Đang đồng bộ thư viện NotebookLM...');
    const result = await mcp.syncLibrary();
    
    console.log('[Sync] Kết quả đồng bộ:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('[Sync] Đang liệt kê các Notebook hiện có...');
    const notebooks = await mcp.listNotebooks();
    console.log(JSON.stringify(notebooks, null, 2));

  } catch (error: any) {
    console.error('[Sync] ❌ Lỗi:', error.message);
  } finally {
    await closeMCPClient();
  }
}

main();
