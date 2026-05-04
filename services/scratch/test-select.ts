import 'dotenv/config';
import mcp, { initMCPClient, closeMCPClient } from '../mcp-client.js';

async function main() {
  try {
    await initMCPClient();
    const notebookId = 'robot-h-ng-d-n-vi-n-b-o-t-ng-t';
    console.log(`[Test] Đang thử select_notebook: ${notebookId}`);
    
    const result = await mcp.callTool('select_notebook', { id: notebookId });
    console.log('[Test] Kết quả:', JSON.stringify(result, null, 2));

  } catch (error: any) {
    console.error('[Test] ❌ Lỗi:', error.message);
  } finally {
    await closeMCPClient();
  }
}

main();
