import { google } from 'googleapis';

/**
 * Google Drive MCP Bridge for NotebookLM Sources
 */

export async function getDriveFiles(apiKey: string, folderId?: string) {
  const drive = google.drive({ version: 'v3', auth: apiKey });
  
  try {
    const response = await drive.files.list({
      q: folderId ? `'${folderId}' in parents and trashed = false` : "trashed = false",
      fields: 'files(id, name, mimeType, size, webViewLink)',
    });
    return response.data.files || [];
  } catch (error: any) {
    console.error('Drive Access Error:', error.message || error);
    throw error;
  }
}

export async function getFileContent(fileId: string, apiKey: string) {
  const drive = google.drive({ version: 'v3', auth: apiKey });
  
  try {
    // 1. Kiểm tra loại file trước
    const fileMeta = await drive.files.get({
      fileId: fileId,
      fields: 'mimeType, name'
    });
    
    const mimeType = fileMeta.data.mimeType;

    // 2. Nếu là Google Doc, phải dùng export
    if (mimeType === 'application/vnd.google-apps.document') {
      const response = await drive.files.export({
        fileId: fileId,
        mimeType: 'text/plain',
      });
      return response.data as string;
    }

    // 3. Nếu là file media/binary/text bình thường
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    }, { responseType: 'text' });
    
    return response.data as string;
  } catch (error: any) {
    console.error(`File Content Error [${fileId}]:`, error.message || error);
    return `[Lỗi đọc file: ${error.message}]`;
  }
}
