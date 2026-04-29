import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Google Embedding Service (text-embedding-004)
 */

export async function generateEmbedding(text: string, apiKey: string) {
  // Làm sạch API Key để tránh lỗi ký tự ẩn
  const cleanKey = apiKey?.replace(/[^\x00-\x7F]/g, "").trim();
  
  if (!cleanKey) {
    throw new Error('EMBEDDING_API_KEY_MISSING');
  }

  const genAI = new GoogleGenerativeAI(cleanKey);
  // Sử dụng định danh đầy đủ models/ để tránh lỗi 404 trên một số region
  const model = genAI.getGenerativeModel({ model: "models/text-embedding-004" });

  try {
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error: any) {
    // Nếu gặp lỗi 404 hoặc lỗi quyền hạn, trả về null để hệ thống tự dùng Keyword Search Fallback
    if (error.status === 404 || error.message?.includes('404')) {
      console.warn(`[Embedding] Model không khả dụng hoặc API chưa bật. Hệ thống sẽ dùng Keyword Fallback.`);
      return null; 
    }
    console.error("Embedding failed:", error.message || error);
    throw error;
  }
}
