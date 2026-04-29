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

// --- NHÓM 1: TRUY VẤN & SÁNG TẠO (QUERY & CREATE) ---

export async function askNotebookLM(question: string, notebookId?: string): Promise<string> {
  const client = await initMCPClient();
  const args: any = { question };
  if (notebookId) args.notebook_id = notebookId;
  
  const result = await client.callTool({ name: 'ask_question', arguments: args });
  const content = result.content as any[];
  return content?.[0]?.text || '';
}

export async function getChatHistory(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  const result = await client.callTool({ name: 'get_notebook_chat_history', arguments: { notebook_id: notebookId } });
  return result;
}

// --- NHÓM 2: NGHIÊN CỨU CHUYÊN SÂU (GEMINI API) ---

export async function deepResearch(query: string): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'deep_research', arguments: { query } });
}

export async function geminiQuery(prompt: string, model: string = 'gemini-3-flash-preview'): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'gemini_query', arguments: { prompt, model } });
}

export async function getResearchStatus(interactionId: string): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'get_research_status', arguments: { interaction_id: interactionId } });
}

// --- NHÓM 3: QUẢN LÝ NOTEBOOK (NOTEBOOK MANAGEMENT) ---

export async function createNotebook(name: string, sources: any[] = [], description: string = ''): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'create_notebook', arguments: { name, sources, description } });
}

export async function batchCreateNotebooks(notebooks: any[]): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'batch_create_notebooks', arguments: { notebooks } });
}

export async function selectNotebook(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'select_notebook', arguments: { notebook_id: notebookId } });
}

export async function syncNotebook(notebookId: string, directory: string, patterns: string[] = ['*.md', '*.pdf']): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'sync_notebook', arguments: { notebook_id: notebookId, directory, patterns } });
}

export async function listNotebooks(): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'list_notebooks', arguments: {} });
}

// --- NHÓM 4: QUẢN LÝ NGUỒN (SOURCE MANAGEMENT) ---

export async function manageSources(notebookId: string, action: 'add' | 'remove', sources: any[]): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'manage_sources', arguments: { notebook_id: notebookId, action, sources } });
}

export async function listSources(notebookId?: string): Promise<any> {
  const client = await initMCPClient();
  const args = notebookId ? { notebook_id: notebookId } : {};
  return await client.callTool({ name: 'list_sources', arguments: args });
}

// --- NHÓM 5: ĐA PHƯƠNG TIỆN STUDIO (MULTIMEDIA) ---

export async function generateAudio(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  return await client.callTool({ name: 'generate_audio_overview', arguments: { notebook_url } });
}

export async function getAudioStatus(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  return await client.callTool({ name: 'get_audio_status', arguments: { notebook_url } });
}

export async function downloadAudio(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  return await client.callTool({ name: 'download_audio', arguments: { notebook_url } });
}

export async function generateVideo(notebookId: string, style: string = 'heritage'): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  return await client.callTool({ name: 'generate_video_overview', arguments: { notebook_url, style } });
}

export async function getVideoStatus(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  return await client.callTool({ name: 'get_video_status', arguments: { notebook_url } });
}

export async function downloadVideo(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  return await client.callTool({ name: 'download_video', arguments: { notebook_url } });
}

export async function generateDataTable(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  return await client.callTool({ name: 'generate_data_table', arguments: { notebook_url } });
}

export async function getDataTable(notebookId: string): Promise<any> {
  const client = await initMCPClient();
  const notebook_url = `https://notebooklm.google.com/notebook/${notebookId}`;
  return await client.callTool({ name: 'get_data_table', arguments: { notebook_url } });
}

// --- NHÓM 6: QUẢN LÝ FILE (FILES API) ---

export async function uploadDocument(path: string): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'upload_document', arguments: { path } });
}

export async function queryDocument(fileId: string, query: string): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'query_document', arguments: { file_id: fileId, query } });
}

export async function deleteDocument(fileId: string): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'delete_document', arguments: { file_id: fileId } });
}

// --- NHÓM 7: HỆ THỐNG & QUẢN TRỊ (SYSTEM & ADMIN) ---

export async function getHealth(): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'get_health', arguments: {} });
}

export async function getQuota(): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'get_quota', arguments: {} });
}

export async function getQueryHistory(): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'get_query_history', arguments: {} });
}

export async function setupAuth(): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'setup_auth', arguments: {} });
}

export async function cleanupData(): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'cleanup_data', arguments: {} });
}

// --- NHÓM 8: WEBHOOK & PHÁP LÝ (WEBHOOK & COMPLIANCE) ---

export async function configureWebhook(url: string, events: string[]): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'configure_webhook', arguments: { url, events } });
}

export async function complianceReport(format: 'json' | 'csv' | 'html' = 'json'): Promise<any> {
  const client = await initMCPClient();
  return await client.callTool({ name: 'compliance_report', arguments: { format } });
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
