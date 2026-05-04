import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  const serverCommand = process.env.MCP_SERVER_COMMAND || 'npx @pan-sec/notebooklm-mcp@latest';
  const [command, ...args] = serverCommand.split(' ');
  const mcpEnv = {
    ...process.env as Record<string, string>,
    NLMCP_AUTH_TOKEN: process.env.NLMCP_AUTH_TOKEN || '',
  };
  const transport = new StdioClientTransport({ command, args, env: mcpEnv });
  const client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);

  console.log("Connected to MCP. Fetching audio status...");
  try {
    const result = await client.callTool({
      name: 'get_audio_status',
      arguments: { notebook_id: "4fab87d9-78ac-460d-9b23-822574fa959d" }
    });
    console.log("RAW RESULT:", JSON.stringify(result, null, 2));
    
    if (result.content && result.content[0] && result.content[0].type === 'text') {
        const parsed = JSON.parse(result.content[0].text);
        console.log("PARSED STATUS:", JSON.stringify(parsed, null, 2));
    }
  } catch(e: any) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
run();
