import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

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

  // Cấu hình môi trường cho server MCP
  // Pantheon-Security MCP thường dùng ADMIN_TOKEN hoặc AUTH_TOKEN
  const mcpEnv = {
    ...process.env as Record<string, string>,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    AUTH_TOKEN: process.env.NLMCP_AUTH_TOKEN || '',
    ADMIN_TOKEN: process.env.NLMCP_AUTH_TOKEN || '',
    NLMCP_ADMIN_TOKEN: process.env.NLMCP_AUTH_TOKEN || '',
    NLMCP_AUTH_TOKEN: process.env.NLMCP_AUTH_TOKEN || '',
  };

  const transport = new StdioClientTransport({
    command,
    args,
    env: mcpEnv,
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
 * Helper để gọi Tool (Sử dụng low-level request để chèn _meta.authToken cho Pantheon-Security)
 */
async function callMcpTool(name: string, args: any = {}, timeout: number = 900000) {
  const client = await initMCPClient();
  const token = process.env.NLMCP_AUTH_TOKEN;

  if (!token) {
    console.warn(`[MCP] ⚠️ Cảnh báo: Không tìm thấy NLMCP_AUTH_TOKEN trong .env`);
  } else {
    // Log vết (ẩn phần lớn token)
    console.log(`[MCP] 🔐 Đang gọi Tool: ${name} (Auth: ${token.substring(0, 4)}...${token.substring(token.length - 4)})`);
  }

  // Sử dụng low-level request để chèn _meta.authToken theo yêu cầu của Pantheon-Security MCP
  const result = await client.request(
    {
      method: "tools/call",
      params: {
        name,
        arguments: args,
        _meta: {
          authToken: token
        }
      }
    },
    CallToolResultSchema,
    { timeout } // Sử dụng timeout tùy chỉnh
  );

  // Kiểm tra lỗi cấp độ Tool (Lỗi hệ thống MCP)
  if (result.isError) {
    const errorText = (result.content as any[])?.[0]?.text || 'Lỗi không xác định từ MCP Server';
    throw new Error(errorText);
  }

  // Kiểm tra lỗi cấp độ Application (Lỗi JSON trả về từ Tool)
  const text = (result.content as any[])?.[0]?.text || '';
  if (text.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.success === false || parsed.error) {
        throw new Error(parsed.error || 'Lỗi thực thi Tool (JSON)');
      }
    } catch (e: any) {
      if (e.message.includes('Lỗi thực thi Tool')) throw e;
      // Không phải JSON lỗi, cứ để nó đi tiếp
    }
  }

  return result;
}

// --- NHÓM 1: TRUY VẤN & SÁNG TẠO (QUERY & CREATE) ---

export async function askNotebookLM(question: string, notebookId?: string): Promise<string> {
  const args: any = { question };
  if (notebookId) args.notebook_id = notebookId;
  const result = await callMcpTool('ask_question', args);
  const content = result.content as any[];
  return content?.[0]?.text || '';
}

export async function getChatHistory(notebookId: string): Promise<any> {
  return await callMcpTool('get_notebook_chat_history', { notebook_id: notebookId });
}

// --- NHÓM 2: NGHIÊN CỨU CHUYÊN SÂU (GEMINI API) ---

export async function deepResearch(query: string): Promise<any> {
  return await callMcpTool('deep_research', { query });
}

export async function geminiQuery(prompt: string, model: string = 'gemini-3-flash-preview'): Promise<any> {
  return await callMcpTool('gemini_query', { prompt, model });
}

export async function getResearchStatus(interactionId: string): Promise<any> {
  return await callMcpTool('get_research_status', { interaction_id: interactionId });
}

// --- NHÓM 3: QUẢN LÝ NOTEBOOK (NOTEBOOK MANAGEMENT) ---

export async function createNotebook(name: string, sources: any[] = [], description: string = ''): Promise<any> {
  return await callMcpTool('create_notebook', { name, sources, description });
}

export async function batchCreateNotebooks(notebooks: any[]): Promise<any> {
  return await callMcpTool('batch_create_notebooks', { notebooks });
}

export async function selectNotebook(id: string): Promise<any> {
  return await callMcpTool('select_notebook', { id });
}

export async function updateNotebook(id: string, name?: string, description?: string): Promise<any> {
  const args: any = { id };
  if (name) args.name = name;
  if (description) args.description = description;
  return await callMcpTool('update_notebook', args);
}

export async function syncNotebook(notebookId: string, directory: string, patterns: string[] = ['*.md', '*.pdf']): Promise<any> {
  return await callMcpTool('sync_notebook', { notebook_id: notebookId, directory, patterns });
}

export async function listNotebooks(): Promise<any> {
  return await callMcpTool('list_notebooks', {});
}

// --- NHÓM 4: QUẢN LÝ NGUỒN (SOURCE MANAGEMENT) ---

export async function manageSources(notebookId: string, action: 'add' | 'remove', sources: any[]): Promise<any> {
  return await callMcpTool('manage_sources', { notebook_id: notebookId, action, sources });
}

export async function listSources(notebookId?: string): Promise<any> {
  const args = notebookId ? { notebook_id: notebookId } : {};
  return await callMcpTool('list_sources', args);
}

// --- NHÓM 5: ĐA PHƯƠNG TIỆN STUDIO (MULTIMEDIA) ---

export async function generateAudio(notebookId: string): Promise<any> {
  return await callMcpTool('generate_audio_overview', { notebook_id: notebookId }, 2400000); // 40 phút
}

export async function getAudioStatus(notebookId: string): Promise<any> {
  const result = await callMcpTool('get_audio_status', { notebook_id: notebookId });
  const text = (result.content as any[])?.[0]?.text || '{}';
  try { return JSON.parse(text); } catch (e) { return { status: 'unknown', raw: text }; }
}

export async function downloadAudio(notebookId: string): Promise<any> {
  const result = await callMcpTool('download_audio', { notebook_id: notebookId });
  const text = (result.content as any[])?.[0]?.text || '{}';
  try { return JSON.parse(text); } catch (e) { return { status: 'error', raw: text }; }
}

export async function generateVideo(notebookId: string, style: string = 'heritage'): Promise<any> {
  return await callMcpTool('generate_video_overview', { notebook_id: notebookId, style }, 2400000); // 40 phút
}

export async function getVideoStatus(notebookId: string): Promise<any> {
  const result = await callMcpTool('get_video_status', { notebook_id: notebookId });
  const text = (result.content as any[])?.[0]?.text || '{}';
  try { return JSON.parse(text); } catch (e) { return { status: 'unknown', raw: text }; }
}

export async function downloadVideo(notebookId: string): Promise<any> {
  const result = await callMcpTool('download_video', { notebook_id: notebookId });
  const text = (result.content as any[])?.[0]?.text || '{}';
  try { return JSON.parse(text); } catch (e) { return { status: 'error', raw: text }; }
}

export async function generateDataTable(notebookId: string): Promise<any> {
  return await callMcpTool('generate_data_table', { notebook_id: notebookId }, 1800000); // 30 phút
}

export async function getDataTable(notebookId: string): Promise<any> {
  return await callMcpTool('get_data_table', { notebook_id: notebookId });
}

// --- NHÓM 6: QUẢN LÝ FILE (FILES API) ---

export async function uploadDocument(path: string): Promise<any> {
  return await callMcpTool('upload_document', { path });
}

export async function queryDocument(fileId: string, query: string): Promise<any> {
  return await callMcpTool('query_document', { file_id: fileId, query });
}

export async function deleteDocument(fileId: string): Promise<any> {
  return await callMcpTool('delete_document', { file_id: fileId });
}

// --- NHÓM 7: HỆ THỐNG & QUẢN TRỊ (SYSTEM & ADMIN) ---

export async function getHealth(): Promise<any> {
  return await callMcpTool('get_health', {});
}

export async function getQuota(): Promise<any> {
  return await callMcpTool('get_quota', {});
}

export async function getQueryHistory(): Promise<any> {
  return await callMcpTool('get_query_history', {});
}

export async function setupAuth(): Promise<any> {
  return await callMcpTool('setup_auth', { show_browser: true });
}

export async function cleanupData(): Promise<any> {
  return await callMcpTool('cleanup_data', {});
}

// --- NHÓM 8: WEBHOOK & PHÁP LÝ (WEBHOOK & COMPLIANCE) ---

export async function configureWebhook(url: string, events: string[]): Promise<any> {
  return await callMcpTool('configure_webhook', { url, events });
}

export async function complianceReport(format: 'json' | 'csv' | 'html' = 'json'): Promise<any> {
  return await callMcpTool('compliance_report', { format });
}

// --- EXPORT DEFAULT ---

export default {
  initMCPClient,
  closeMCPClient,
  // Content & Research
  askNotebookLM,
  getChatHistory,
  deepResearch,
  geminiQuery,
  getResearchStatus,
  // Notebooks
  createNotebook,
  batchCreateNotebooks,
  selectNotebook,
  updateNotebook,
  syncNotebook,
  listNotebooks,
  // Sources & Files
  manageSources,
  listSources,
  uploadDocument,
  queryDocument,
  deleteDocument,
  // Multimedia Studio
  generateAudio,
  getAudioStatus,
  downloadAudio,
  generateVideo,
  getVideoStatus,
  downloadVideo,
  generateDataTable,
  getDataTable,
  // System
  getHealth,
  getQuota,
  getQueryHistory,
  setupAuth,
  cleanupData,
  // Webhook & Compliance
  configureWebhook,
  complianceReport
};
