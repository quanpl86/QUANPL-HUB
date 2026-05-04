import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { buildDeepResearchPrompt } from './prompt-templates.js';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

/**
 * MCP Client — Cầu nối đến NotebookLM MCP Server
 */

let mcpClient: Client | null = null;

export async function initMCPClient(): Promise<Client> {
  if (mcpClient) return mcpClient;
  
  const serverCommand = process.env.MCP_SERVER_COMMAND || 'npx @pan-sec/notebooklm-mcp@latest';
  const [command, ...args] = serverCommand.split(' ');
  
  const mcpEnv = {
    ...process.env as Record<string, string>,
    AUTH_TOKEN: process.env.NLMCP_AUTH_TOKEN || '',
    ADMIN_TOKEN: process.env.NLMCP_AUTH_TOKEN || '',
    NLMCP_RESPONSE_TIMEOUT: process.env.NLMCP_RESPONSE_TIMEOUT || '900000',
    NLMCP_ACTION_TIMEOUT: process.env.NLMCP_ACTION_TIMEOUT || '900000',
    NLMCP_HEADLESS: process.env.NLMCP_HEADLESS || 'false',
    NLMCP_DEBUG: 'true',
    NLMCP_DOWNLOAD_PATH: '/Users/mac/Downloads',
  };
  
  const transport = new StdioClientTransport({ command, args, env: mcpEnv });
  mcpClient = new Client(
    { name: 'quan-pl-hub-worker', version: '2.6.0' }, 
    { capabilities: {} }
  );
  
  await mcpClient.connect(transport);
  logger.info('✅ MCP Client connected successfully');
  return mcpClient;
}

export async function closeMCPClient() {
  if (mcpClient) {
    logger.info('🛑 Closing MCP Client connection...');
    await mcpClient.close();
    mcpClient = null;
  }
}

async function callMcpTool(name: string, args: any = {}, timeoutMs: number = 900000) {
  try {
    const client = await initMCPClient();
    const token = process.env.NLMCP_AUTH_TOKEN;

    const result = await client.request(
      {
        method: "tools/call",
        params: { name, arguments: args, _meta: { authToken: token } }
      },
      CallToolResultSchema,
      { timeout: timeoutMs }
    );

    if (result.isError) {
      const errorText = (result.content as any[])?.[0]?.text || 'Unknown MCP Error';
      logger.error({ tool: name, error: errorText }, '❌ MCP Tool Error');
      throw new Error(`MCP Tool "${name}" failed: ${errorText}`);
    }

    return result;
  } catch (err: any) {
    logger.error({ tool: name, error: err.message }, '🔥 MCP Call failed');
    throw err;
  }
}

// Helper parse content
function parseContent(result: any): any {
  try {
    const text = (result.content as any[])?.[0]?.text || '{}';
    return JSON.parse(text);
  } catch {
    return { status: 'unknown', raw: result };
  }
}

// --- CORE TOOLS ---

export async function askQuestion(question: string, notebookId?: string): Promise<string> {
  return await askNotebookLM(question, notebookId);
}

export async function askNotebookLM(question: string, notebookId?: string): Promise<string> {
  const args: any = {
    question,
    browser_options: {
      timeout_ms: 300000 // Tối đa 5 phút cho mỗi thao tác (Action), tổng phản hồi sẽ do Env kiểm soát
    }
  };
  if (notebookId) args.notebook_id = notebookId;
  const result = await callMcpTool('ask_question', args, 900000); // SDK timeout 15 phút
  return (result.content as any[])?.[0]?.text || '';
}

/**
 * Tạo Audio Overview. Nếu truyền URL trực tiếp → bypass library lookup.
 */
export async function generateAudio(notebookIdOrUrl: string): Promise<any> {
  const args: any = { browser_options: { timeout_ms: 300000 } };
  if (notebookIdOrUrl.startsWith('http')) {
    args.notebook_url = notebookIdOrUrl;
  } else {
    args.notebook_id = notebookIdOrUrl;
  }
  return await callMcpTool('generate_audio_overview', args, 2400000);
}

/**
 * Tạo Video Overview. Nếu truyền URL trực tiếp → bypass library lookup.
 */
export async function generateVideoOverview(notebookIdOrUrl: string, style: string = 'heritage'): Promise<any> {
  const args: any = { style, browser_options: { timeout_ms: 300000 } };
  if (notebookIdOrUrl.startsWith('http')) {
    args.notebook_url = notebookIdOrUrl;
  } else {
    args.notebook_id = notebookIdOrUrl;
  }
  return await callMcpTool('generate_video_overview', args, 2400000);
}

export async function selectNotebook(id: string): Promise<any> {
  return await callMcpTool('select_notebook', { id });
}

export async function listNotebooks(): Promise<any> {
  return await callMcpTool('list_notebooks', {});
}

export async function getAudioStatus(notebookIdOrUrl: string): Promise<any> {
  const args: any = {};
  if (notebookIdOrUrl.startsWith('http')) { args.notebook_url = notebookIdOrUrl; } else { args.notebook_id = notebookIdOrUrl; }
  const result = await callMcpTool('get_audio_status', args);
  return parseContent(result);
}

export async function downloadAudio(notebookIdOrUrl: string): Promise<any> {
  const args: any = { browser_options: { timeout_ms: 600000 } }; // Đợi 10 phút
  if (notebookIdOrUrl.startsWith('http')) { args.notebook_url = notebookIdOrUrl; } else { args.notebook_id = notebookIdOrUrl; }
  const result = await callMcpTool('download_audio', args, 900000);
  return parseContent(result);
}

export async function getVideoStatus(notebookIdOrUrl: string): Promise<any> {
  const args: any = {};
  if (notebookIdOrUrl.startsWith('http')) { args.notebook_url = notebookIdOrUrl; } else { args.notebook_id = notebookIdOrUrl; }
  const result = await callMcpTool('get_video_status', args);
  return parseContent(result);
}

export async function deepResearch(topic: string): Promise<any> {
  const prompt = buildDeepResearchPrompt(topic);

  const result = await callMcpTool('ask_question', {
    question: prompt,
    browser_options: { timeout_ms: 600000 } // Đợi 10 phút cho nghiên cứu
  }, 900000);

  return result;
}

export async function generateDataTable(notebookId: string): Promise<any> {
  return await callMcpTool('generate_data_table', { notebook_id: notebookId });
}

export async function getDataTable(notebookId: string): Promise<any> {
  const result = await callMcpTool('get_data_table', { notebook_id: notebookId });
  return parseContent(result);
}

export async function downloadVideo(notebookId: string): Promise<any> {
  const result = await callMcpTool('download_video', { notebook_id: notebookId }, 900000);
  return parseContent(result);
}

export async function createNotebook(name: string, sources: any[] = [], description: string = ''): Promise<any> {
  const result = await callMcpTool('create_notebook', { name, sources, description });
  return parseContent(result);
}

export async function manageSources(notebookId: string, action: 'add' | 'remove', sources: any[]): Promise<any> {
  return await callMcpTool('manage_sources', { notebook_id: notebookId, action, sources });
}

export async function updateNotebook(notebookId: string, name: string): Promise<any> {
  return await callMcpTool('update_notebook', { notebook_id: notebookId, name });
}

export async function syncLibrary(): Promise<any> {
  return await callMcpTool('sync_library', {}, 900000); // Tăng timeout lên 15 phút
}

export async function getHealth(): Promise<any> {
  return await callMcpTool('get_health', {});
}

export async function setupAuth(): Promise<any> {
  return await callMcpTool('setup_auth', { show_browser: true });
}

export async function getQuota(): Promise<any> {
  const result = await callMcpTool('get_quota', {});
  return parseContent(result);
}

export default {
  initMCPClient, closeMCPClient,
  askQuestion, askNotebookLM, generateAudio, generateAudioOverview: generateAudio,
  generateVideoOverview, selectNotebook, listNotebooks, 
  getAudioStatus, downloadAudio, getVideoStatus, syncLibrary,
  getHealth, setupAuth, getQuota, createNotebook, updateNotebook, manageSources, deepResearch,
  generateDataTable, getDataTable, downloadVideo
};
