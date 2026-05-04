import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@pan-sec/notebooklm-mcp@latest'],
    env: { ...process.env, NLMCP_HEADLESS: 'true' }
  });

  const client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);

  const tools = await client.listTools();
  console.log(JSON.stringify(tools, null, 2));
  
  await client.close();
}

main().catch(console.error);
