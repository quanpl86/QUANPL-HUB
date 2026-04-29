import { google } from 'googleapis';

/**
 * Google Cloud Service for Calendar & Drive integration
 */

export async function createSchedulingEvent(data: {
  title: string;
  description: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  apiKey: string;
}) {
  if (!data.apiKey) {
    throw new Error('GOOGLE_CLOUD_API_KEY_MISSING');
  }

  // Lưu ý: Đối với phía server-side, thường dùng Service Account (JWT) 
  // hoặc OAuth2. Tuy nhiên, nếu user chỉ cung cấp API Key, ta chỉ có thể 
  // đọc dữ liệu Public hoặc dùng các phương thức bị giới hạn.
  
  // Ở đây chúng ta giả định hệ thống sẽ dùng OAuth2 Client nếu cần ghi dữ liệu 
  // (Ví dụ: Create Event). 
  // Để đơn giản cho demo này, chúng ta sẽ cấu trúc hóa mã nguồn.
  
  try {
    const calendar = google.calendar({ version: 'v3', auth: data.apiKey });
    
    const event = {
      summary: data.title,
      description: data.description,
      start: { dateTime: data.startTime },
      end: { dateTime: data.endTime },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    
    return { success: true, eventId: response.data.id };
  } catch (error: any) {
    console.error('Error with Google Calendar:', error.message || error);
    // Nếu lỗi do quyền hạn API Key, ném lỗi rõ ràng
    throw new Error(`Calendar API Error: ${error.message}. Lưu ý: API Key thường chỉ có quyền đọc, để ghi lịch cần dùng Service Account hoặc OAuth2.`);
  }
}

/**
 * Hàm lấy danh sách tài liệu từ Google Drive (Knowledge Base)
 */
export async function listDriveFiles(apiKey: string) {
  try {
    const drive = google.drive({ version: 'v3', auth: apiKey });
    const response = await drive.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name, mimeType)',
    });
    return response.data.files;
  } catch (error) {
    console.error('Error with Google Drive:', error);
    throw error;
  }
}
