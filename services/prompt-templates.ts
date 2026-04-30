/**
 * Prompt Engineering Templates cho NotebookLM
 * 
 * NotebookLM AI chỉ trả lời dựa trên nguồn tri thức trong Notebook (zero-hallucination).
 * Prompt phải ép NotebookLM trả về JSON nghiêm ngặt để Worker bóc tách được.
 */

/**
 * Prompt chính: Yêu cầu NotebookLM viết bài blog chi tiết
 */
export function buildContentPrompt(topic: string, customPrompt?: string): string {
  const customSection = customPrompt 
    ? `\n**YÊU CẦU BỔ SUNG TỪ NGƯỜI DÙNG:**\n${customPrompt}\n` 
    : '';

  return `
Bạn là một chuyên gia biên tập nội dung STEM/Công nghệ. Hãy viết một bài blog chi tiết, chuyên sâu về chủ đề sau:

**Chủ đề:** ${topic}
${customSection}
**YÊU CẦU NỘI DUNG:**
1. Ngôn ngữ: Tiếng Việt, văn phong chuyên nghiệp, học thuật nhưng dễ tiếp cận.
2. Cấu trúc: Sử dụng Markdown (H2, H3) để phân cấp nội dung rõ ràng. 
   **BẮT BUỘC: Luôn có 2 dấu xuống dòng (\\n\\n) sau mỗi tiêu đề và giữa các đoạn văn.**
3. Độ dài: Tối thiểu 1500 từ, khai thác sâu các khía cạnh kỹ thuật từ Notebook.
4. Minh họa: Sử dụng các ví dụ thực tế hoặc code block nếu cần.
5. Tuyệt đối: Chỉ sử dụng thông tin có trong nguồn tri thức của Notebook.

**YÊU CẦU ĐỊNH DẠNG (CỰC KỲ QUAN TRỌNG):**
Bạn PHẢI trả về kết quả dưới định dạng JSON duy nhất. KHÔNG bao gồm bất kỳ văn bản dẫn nhập, giải thích hay lời chào nào bên ngoài khối JSON này.

Cấu trúc JSON yêu cầu:
{
  "title": "Tiêu đề chuẩn SEO (50-70 ký tự)",
  "content": "Toàn bộ bài viết bằng Markdown (H2, H3, bold, list...)",
  "seo": {
    "meta_title": "Tiêu đề thẻ Meta Title (tối ưu click)",
    "meta_description": "Mô tả thẻ Meta Description (120-150 ký tự, chứa từ khóa chính)",
    "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4"],
    "excerpt": "Đoạn dẫn nhập ngắn (150-200 ký tự) tóm tắt ý chính hấp dẫn"
  },
  "schema": {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "Tiêu đề bài viết",
    "author": {
      "@type": "Person",
      "name": "Quân PL"
    }
  }
}
`.trim();
}

/**
 * Prompt phụ: Yêu cầu NotebookLM cung cấp thêm context
 */
export function buildResearchPrompt(topic: string): string {
  return `
Hãy tổng hợp tất cả thông tin liên quan đến "${topic}" từ các nguồn tri thức trong Notebook này.

Trả lời theo cấu trúc:
1. **Tóm tắt:** Khái quát 2-3 câu về chủ đề
2. **Điểm chính:** Liệt kê 5-7 điểm quan trọng nhất
3. **Chi tiết kỹ thuật:** Nếu có code, công thức, hoặc quy trình cụ thể
4. **Nguồn tham khảo:** Ghi rõ dữ liệu lấy từ nguồn nào trong Notebook

Trả lời bằng Tiếng Việt.
`.trim();
}

/**
 * Bóc tách JSON từ response của NotebookLM
 * NotebookLM có thể trả về JSON nằm trong code block hoặc mixed text
 */
export function parseNotebookResponse(response: string): {
  title?: string;
  content?: string;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
    excerpt?: string;
  };
  schema?: Record<string, any>;
} | null {
  if (!response) return null;

  let cleaned = response.trim();

  // Hàm helper để thử parse và trích xuất dữ liệu từ các cấu trúc lồng nhau
  const extractData = (obj: any): any => {
    let answerStr = obj;
    // Nếu obj có trường 'answer', ưu tiên lấy từ đó (cấu trúc của MCP Server)
    if (obj.data && obj.data.answer) answerStr = obj.data.answer;
    else if (obj.answer) answerStr = obj.answer;

    // Nếu answerStr vẫn là một chuỗi, chứng tỏ AI trả về JSON string lồng nhau
    if (typeof answerStr === 'string') {
      try {
        return JSON.parse(answerStr);
      } catch (e) {
        // Thử tìm khối code JSON bên trong chuỗi answer
        const innerMatch = answerStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (innerMatch) {
          try { return JSON.parse(innerMatch[1].trim()); } catch (e2) {}
        }
        // Thử tìm dấu ngoặc
        const first = answerStr.indexOf('{');
        const last = answerStr.lastIndexOf('}');
        if (first !== -1 && last > first) {
            try { return JSON.parse(answerStr.substring(first, last + 1)); } catch(e3) {}
        }
        
        // CỨU CÁNH BẰNG REGEX (Khi JSON bị vỡ cấu trúc do nội dung quá dài/lỗi escape)
        console.log('[Worker] JSON Parse failed, fallback to Regex extraction...');
        const titleMatch = answerStr.match(/\"title\"\s*:\s*\"(.*?)\"/);
        const title = titleMatch ? titleMatch[1] : '';
        
        const contentMatch = answerStr.match(/\"content\"\s*:\s*\"([\s\S]*?)\"\s*,\s*\"seo\"/);
        let content = contentMatch ? contentMatch[1] : answerStr;
        content = content.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        
        // Trích xuất SEO
        const metaDescMatch = answerStr.match(/\"meta_description\"\s*:\s*\"(.*?)\"/);
        const meta_description = metaDescMatch ? metaDescMatch[1] : '';
        
        const excerptMatch = answerStr.match(/\"excerpt\"\s*:\s*\"(.*?)\"/);
        const excerpt = excerptMatch ? excerptMatch[1] : '';
        
        let keywords: string[] = [];
        const keywordsMatch = answerStr.match(/\"keywords\"\s*:\s*\[([\s\S]*?)\]/);
        if (keywordsMatch) {
            keywords = keywordsMatch[1].split(',').map((k: string) => k.replace(/\"/g, '').trim()).filter((k: string) => k);
        }

        return { 
          title, 
          content,
          seo: {
            meta_title: title,
            meta_description,
            excerpt,
            keywords
          }
        };
      }
    }
    return answerStr;
  };

  try {
    // 1. Thử parse trực tiếp
    const raw = JSON.parse(cleaned);
    return extractData(raw);
  } catch (e) {
    // 2. Tìm khối JSON trong code fences
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const raw = JSON.parse(jsonMatch[1].trim());
        return extractData(raw);
      } catch (e2) { }
    }

    // 3. Tìm khối JSON bằng cách xác định dấu ngoặc nhọn đầu và cuối
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonCandidate = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        // Thử parse và xử lý lồng nhau
        const raw = JSON.parse(jsonCandidate.replace(/\n/g, ' ').replace(/\r/g, ''));
        return extractData(raw);
      } catch (e3) {
        try {
          const raw = JSON.parse(jsonCandidate);
          return extractData(raw);
        } catch (e4) { }
      }
    }

    return null;
  }
}
