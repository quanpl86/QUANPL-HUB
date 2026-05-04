import 'dotenv/config';
import { initMCPClient, closeMCPClient } from '../mcp-client.js';

async function main() {
  try {
    const client = await initMCPClient();
    const tools = await client.listTools();
    const askTool = tools.tools.find(t => t.name === 'ask_question');
    
    console.log('--- CHI TIẾT TOOL ASK_QUESTION ---');
    console.log(JSON.stringify(askTool, null, 2));

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await closeMCPClient();
  }
}

main();
