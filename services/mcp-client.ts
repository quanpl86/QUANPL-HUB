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
 * Đóng kết nối MCP
 */
export async function closeMCPClient() {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
    console.log('[MCP] Đã đóng kết nối.');
  }
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
          arguments: {
            notebook_id: notebookId,
          },
        },
      },
      {} as any
    );

    return !(result as any).isError;
  } catch (error: any) {
    console.error('[MCP] Lỗi chọn notebook:', error.message);
    return false;
  }
}

/**
 * Hỏi NotebookLM
 */
export async function askNotebookLM(prompt: string, notebookId?: string): Promise<string> {
  const client = await initMCPClient();

  if (notebookId) {
    await selectNotebook(notebookId);
  }

  try {
    console.log('[MCP] Đang gửi câu hỏi đến NotebookLM...');
    
    const result = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'ask_question',
          arguments: {
            question: prompt,
          },
        },
      },
      {} as any
    );

    const response = result as any;
    
    if (response.isError) {
      throw new Error(response.content?.[0]?.text || 'Lỗi không xác định từ MCP');
    }

    return response.content?.[0]?.text || '';
  } catch (error: any) {
    console.error('[MCP] Lỗi ask_question:', error.message);
    throw error;
  }
}

/**
 * Liệt kê các nguồn trong Notebook
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

// --- CÁC HÀM TIỆN ÍCH ĐA PHƯƠNG TIỆN (STUDIO) ---

/**
 * Ra lệnh tạo Podcast (Audio Overview)
 */
export async function generateAudioOverview(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  
  return await client.callTool(
    {
      name: 'generate_audio_overview',
      arguments: { notebook_url },
      _meta: { authToken: process.env.NLMCP_AUTH_TOKEN }
    },
    { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) } as any,
    { timeout: 600000 }
  );
}

/**
 * Kiểm tra trạng thái tạo Podcast
 */
export async function getAudioStatus(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  
  return await client.callTool(
    {
      name: 'get_audio_status',
      arguments: { notebook_url },
      _meta: { authToken: process.env.NLMCP_AUTH_TOKEN }
    },
    { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) } as any
  );
}

/**
 * Tải file Audio về
 */
export async function downloadAudio(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  
  return await client.callTool(
    {
      name: 'download_audio',
      arguments: { notebook_url },
      _meta: { authToken: process.env.NLMCP_AUTH_TOKEN }
    },
    { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) } as any
  );
}

/**
 * Tạo Video tóm tắt (Video Overview)
 */
export async function generateVideoOverview(notebookId: string, style: string = 'modern'): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  
  return await client.callTool(
    {
      name: 'generate_video_overview',
      arguments: { notebook_url, style },
      _meta: { authToken: process.env.NLMCP_AUTH_TOKEN }
    },
    { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) } as any,
    { timeout: 600000 }
  );
}

/**
 * Trích xuất bảng dữ liệu từ nguồn Notebook (JSON)
 */
export async function generateDataTable(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  
  return await client.callTool(
    {
      name: 'generate_data_table',
      arguments: { notebook_url },
      _meta: { authToken: process.env.NLMCP_AUTH_TOKEN }
    },
    { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) } as any
  );
}

// --- CÁC HÀM QUẢN TRỊ & HỆ THỐNG (ADMIN) ---

/**
 * Kiểm tra sức khỏe hệ thống (Deep Health Check)
 */
export async function getHealth(): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool(
    { name: 'get_health', arguments: {} },
    { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) } as any
  );
}

/**
 * Lấy hạn mức (Quota) sử dụng
 */
export async function getQuota(): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool(
    { name: 'get_quota', arguments: {} },
    { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) } as any
  );
}

/**
 * Lấy lịch sử truy vấn của MCP
 */
export async function getQueryHistory(): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool(
    { name: 'get_query_history', arguments: {} },
    { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) } as any
  );
}

// Export mặc định object chứa tất cả các hàm
export default {
  initMCPClient,
  closeMCPClient,
  askNotebookLM,
  selectNotebook,
  listSources,
  generateAudioOverview,
  getAudioStatus,
  downloadAudio,
  generateVideoOverview,
  generateDataTable,
  getHealth,
  getQuota,
  getQueryHistory
};
