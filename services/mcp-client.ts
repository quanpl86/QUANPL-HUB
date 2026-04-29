import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * MCP Client — Cầu nối đến NotebookLM MCP Server
 * Sử dụng stdio transport để giao tiếp với MCP Server local
 */

let mcpClient: Client | null = null;

/**
 * Khởi tạo kết nối MCP Client
 */
export async function initMCPClient(): Promise<Client> {
  if (mcpClient) return mcpClient;

  const serverCommand = process.env.MCP_SERVER_COMMAND || 'npx @pan-sec/notebooklm-mcp@latest';
  const [command, ...args] = serverCommand.split(' ');

  console.log(`[MCP] Khởi động MCP Server: ${serverCommand}`);

  const transport = new StdioClientTransport({
    command,
    args,
    env: {
      ...process.env as Record<string, string>,
      // Truyền Gemini Key nếu có (cho Deep Research)
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    },
  });

  mcpClient = new Client(
    { name: 'quan-pl-hub-worker', version: '1.0.0' },
    { capabilities: {} }
  );

  await mcpClient.connect(transport);
  console.log('[MCP] Đã kết nối thành công với NotebookLM MCP Server.');

  return mcpClient;
}

/**
 * Chọn Notebook để làm việc
 */
export async function selectNotebook(notebookId: string): Promise<boolean> {
  const client = await initMCPClient();

  try {
    const result = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'select_notebook',
          arguments: { id: notebookId },
          _meta: { authToken: process.env.NLMCP_AUTH_TOKEN }
        }
      },
      { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) } as any
    ) as any;

    console.log(`[MCP] Đã chọn notebook: ${notebookId}`);
    return true;
  } catch (error: any) {
    console.error(`[MCP] Lỗi chọn notebook ${notebookId}:`, error.message);
    return false;
  }
}

/**
 * Hỏi NotebookLM AI viết bài dựa trên tri thức trong notebook
 */
export async function askNotebookLM(question: string, notebookId?: string): Promise<string> {
  const client = await initMCPClient();

  // Tạo URL trực tiếp nếu có ID
  const notebook_url = notebookId ? `https://notebooklm.google.com/notebook/${notebookId}` : undefined;

  try {
    const result = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'ask_question',
          arguments: { 
            question,
            ...(notebook_url ? { notebook_url } : {})
          },
          _meta: { authToken: process.env.NLMCP_AUTH_TOKEN }
        }
      },
      { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) } as any,
      { timeout: 900000 } // Tăng timeout lên 15 phút để thoải mái gõ và đợi bài viết dài
    ) as any;

    // Trích xuất text content từ kết quả MCP
    if (result.content && Array.isArray(result.content)) {
      return result.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n');
    }

    return String(result.content || '');
  } catch (error: any) {
    console.error('[MCP] Lỗi ask_question:', error.message);
    throw error;
  }
}

/**
 * Lấy danh sách notebooks có sẵn
 */
export async function listNotebooks(): Promise<any[]> {
  const client = await initMCPClient();

  try {
    const result = await client.callTool({
      name: 'list_notebooks',
      arguments: {},
    });

    if (result.content && Array.isArray(result.content)) {
      const textContent = result.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n');

      try {
        return JSON.parse(textContent);
      } catch {
        return [];
      }
    }

    return [];
  } catch (error: any) {
    console.error('[MCP] Lỗi list_notebooks:', error.message);
    return [];
  }
}

/**
 * Lấy danh sách sources trong notebook hiện tại
 */
export async function listSources(): Promise<any[]> {
  const client = await initMCPClient();

  try {
    const result = await client.callTool({
      name: 'list_sources',
      arguments: {},
    });

    if (result.content && Array.isArray(result.content)) {
      const textContent = result.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n');

      try {
        return JSON.parse(textContent);
      } catch {
        return [];
      }
    }

    return [];
  } catch (error: any) {
    console.error('[MCP] Lỗi list_sources:', error.message);
    return [];
  }
}

/**
 * Đóng kết nối MCP
 */
export async function closeMCPClient() {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
    console.log('[MCP] Đã đóng kết nối.');
  }
}
