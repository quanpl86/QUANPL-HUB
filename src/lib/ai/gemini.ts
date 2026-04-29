import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini AI Service for Content Generation
 */

export async function generateContent(prompt: string, apiKey: string, modelName: string = 'gemini-1.5-pro') {
  const cleanKey = apiKey?.replace(/[^\x00-\x7F]/g, "").trim();
  const cleanModelName = modelName?.replace(/[^\x00-\x7F]/g, "").trim();

  if (!cleanKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  try {
    const genAI = new GoogleGenerativeAI(cleanKey);
    
    // Cấu hình nâng cao cho các model thế hệ mới
    let config: any = {};
    let tools: any[] = [{ googleSearch: {} }]; // Luôn bật Google Search để thay thế Perplexity

    if (modelName === 'gemini-3-flash-preview') {
      config = { thinkingConfig: { thinkingLevel: 'HIGH' } };
    } else if (modelName === 'gemini-3.1-flash-lite-preview') {
      config = { thinkingConfig: { thinkingLevel: 'MINIMAL' } };
    }

    const model = genAI.getGenerativeModel({ 
      model: cleanModelName,
      generationConfig: config,
      tools: tools
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini:', error);
    throw error;
  }
}

/**
 * Hàm chuyên dụng để viết bài blog dựa trên dữ liệu nghiên cứu + SEO Metadata
 */
export async function writeBlogPost(researchData: string, topic: string, style: string, apiKey: string, modelName: string = 'gemini-1.5-pro') {
  const prompt = `
    Bạn là một chuyên gia biên tập nội dung và chuyên gia SEO chuyên nghiệp với phong cách "${style}".
    
    NHIỆM VỤ CỦA BẠN:
    1. Kiểm tra dữ liệu nghiên cứu/ngữ cảnh được cung cấp. Nếu đó đã là một bài viết khá đầy đủ, hãy GIỮ NGUYÊN nội dung cốt lõi và phong cách của tác giả.
    2. Tối ưu hóa cấu trúc: Chuyển đổi thành định dạng Markdown chuyên nghiệp (H1, H2, H3, list, bold).
    3. Xử lý hình ảnh thông minh: 
       - Nếu trong nội dung gốc có các đoạn mô tả ảnh hoặc gợi ý ảnh (Prompts), hãy chuyển đổi chúng thành định dạng thẻ: [IMAGE: mô tả chi tiết để tạo ảnh].
       - Nếu có mô tả dành riêng cho ảnh bìa hoặc ảnh đại diện bài viết, hãy dùng thẻ: [COVER_IMAGE: mô tả chi tiết].
       - Nếu thiếu ảnh, hãy chủ động chèn thêm thẻ [IMAGE] ở các vị trí hợp lý để minh họa cho nội dung.
    4. Bài viết phải bằng Tiếng Việt, lôi cuốn và đạt điểm SEO cao.

    DỮ LIỆU ĐẦU VÀO (TỪ DRIVE/RESEARCH):
    ---
    ${researchData}
    ---
    
    Yêu cầu về SEO:
    Tạo bộ SEO Metadata ở cuối bài viết theo định dạng JSON:
    [SEO_DATA]
    {
      "meta_title": "Tiêu đề SEO",
      "meta_description": "Mô tả SEO",
      "keywords": ["keyword1", "..."],
      "excerpt": "Tóm tắt ngắn gọn"
    }
    [/SEO_DATA]
  `;

  const result = await generateContent(prompt, apiKey, modelName);
  
  // Trích xuất dữ liệu SEO từ kết quả trả về
  const seoMatch = result.match(/\[SEO_DATA\]([\s\S]*?)\[\/SEO_DATA\]/);
  const seoData = seoMatch ? JSON.parse(seoMatch[1]) : null;
  const cleanContent = result.replace(/\[SEO_DATA\][\s\S]*?\[\/SEO_DATA\]/, '').trim();

  return {
    content: cleanContent,
    seo: seoData
  };
}
