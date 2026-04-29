import 'dotenv/config';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

async function setup() {
  console.log('🚀 Đang khởi tạo tiến trình đăng nhập Google...');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: [path.join(process.cwd(), 'node_modules/@pan-sec/notebooklm-mcp/dist/index.js')],
    env: {
      ...process.env,
      NLMCP_SHOW_BROWSER: 'true',
      NLMCP_AUTH_DISABLED: 'true'
    }
  });

  const client = new Client(
    { name: 'auth-helper', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log('✅ Đã kết nối với MCP Server. Đang mở trình duyệt...');

  try {
    // Gọi tool setup_auth
    const result = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'setup_auth',
          arguments: { show_browser: true },
          _meta: { authToken: process.env.NLMCP_AUTH_TOKEN }
        }
      },
      { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) } as any
    );

    console.log('ℹ️  Kết quả:', JSON.stringify(result, null, 2));
    console.log('\n👉 QUÂN ƠI: Hãy đăng nhập Google ở cửa sổ trình duyệt vừa hiện lên.');
    console.log('👉 Sau khi đăng nhập xong, hãy bấm Ctrl+C ở đây để kết thúc.');
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
  }
}

setup();
