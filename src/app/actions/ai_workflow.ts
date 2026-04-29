'use server';

import { getAutomationSettings, createAutomationLog } from './automation';
import { researchTopic } from '@/lib/ai/perplexity';
import { writeBlogPost } from '@/lib/ai/gemini';
import { generateImage } from '@/lib/ai/image-gen';
import { queryInternalKnowledge } from '@/lib/ai/mcp-bridge';
import { createSchedulingEvent } from '@/lib/ai/google-cloud';
import { getInternalLinksContext } from '@/lib/ai/internal-linker';
import { createAIDraft } from './posts';
import { checkAdmin } from '@/lib/auth-utils';
import { marked } from 'marked';

/**
 * AI Content Pipeline: Knowledge -> Research -> Generation -> Visuals -> Staging -> Scheduling
 */
export async function runFullContentPipeline(topic: string, selectedFiles: string[] = []): Promise<{
  success: boolean;
  data?: {
    topic: string;
    content: string;
    research: string;
    slug: string;
    image_url: string | null;
  };
  error?: string;
}> {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  
  const settings = await getAutomationSettings();
  const getSetting = (key: string) => settings.find(s => s.key_name === key)?.key_value;

  const PERPLEXITY_KEY = getSetting('PERPLEXITY_API_KEY');
  const GEMINI_KEY = getSetting('GEMINI_API_KEY'); // Chỉ lấy từ trường API_KEY
  const WRITING_STYLE = getSetting('WRITING_STYLE') || 'Senior Robotics Engineer (Standard)';
  const GOOGLE_KEY = getSetting('GOOGLE_CLOUD_API_KEY');

  try {
    // 0. Bắt đầu luồng song song: Tạo ảnh ngay khi có chủ đề
    const imageTask = generateImage(`${topic}, high quality digital art, cyberpunk technical style, professional blog cover`)
      .catch(err => {
        console.error('Image Gen failed:', err);
        return null;
      });

    // 1. Giai đoạn Tri thức nội bộ (Knowledge - MCP Bridge)
    await createAutomationLog('Knowledge', 'INFO', `Đang truy xuất tri thức từ ${selectedFiles.length > 0 ? 'các file được chọn' : 'toàn bộ MCP Hub'}...`);
    const internalKnowledge = await queryInternalKnowledge(topic, selectedFiles);
    await createAutomationLog('Knowledge', 'SUCCESS', `Đã xử lý xong dữ liệu nội bộ.`, {
      selected_files: selectedFiles,
      context_length: internalKnowledge.length
    });

    // 2. Giai đoạn Nghiên cứu (Research)
    let researchResult = "";
    if (PERPLEXITY_KEY) {
      await createAutomationLog('Research', 'INFO', `Đang tìm kiếm thông tin bổ trợ qua Perplexity...`);
      researchResult = await researchTopic(`${topic}\n\nNgữ cảnh: ${internalKnowledge}`, PERPLEXITY_KEY);
      await createAutomationLog('Research', 'SUCCESS', `Đã thu thập dữ liệu nghiên cứu từ Perplexity.`);
    } else {
      await createAutomationLog('Research', 'INFO', `Chế độ Tiết kiệm: Sẽ sử dụng Google Search tích hợp trong Gemini.`);
      researchResult = "Sử dụng Google Search để tìm kiếm thông tin mới nhất về chủ đề này.";
    }

    // 2.1. Lấy ngữ cảnh liên kết nội bộ (SEO Matrix)
    const internalLinks = await getInternalLinksContext();

    // 3. Giai đoạn Sáng tạo nội dung & SEO (Generation)
    await createAutomationLog('Generation', 'INFO', `Đang soạn thảo bài viết và tối ưu hóa SEO...`);
    const MODEL = getSetting('AI_MODEL_PREFERENCE') || 'gemini-1.5-pro';
    const { content, seo } = await writeBlogPost(researchResult + "\n\n" + internalLinks, topic, WRITING_STYLE, GEMINI_KEY || '', MODEL);
    await createAutomationLog('Generation', 'SUCCESS', `King Dragon đã hoàn thành nội dung và bộ SEO Metadata.`);

    // 4. Giai đoạn Hình ảnh (Visuals)
    await createAutomationLog('Visuals', 'INFO', `Đang hoàn thiện phần hình ảnh và minh họa nội bộ...`);
    const imageUrl = await imageTask;

    // Xử lý chèn ảnh vào thân bài (Multi-modal)
    let finalContent = content;
    const imageMatches = content.match(/\[IMAGE: (.*?)\]/g);
    
    if (imageMatches) {
      await createAutomationLog('Visuals', 'INFO', `Đang tạo ${imageMatches.length} ảnh minh họa nội bộ...`);
      for (const match of imageMatches) {
        const description = match.replace('[IMAGE: ', '').replace(']', '');
        const inlineImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(description + ', cyberpunk style, professional photography')}?width=800&height=450&model=flux&nologo=true`;
        finalContent = finalContent.replace(match, `\n\n![${description}](${inlineImageUrl})\n\n`);
      }
    }

    await createAutomationLog('Visuals', imageUrl ? 'SUCCESS' : 'WARNING', imageUrl ? `Đã chuẩn bị xong ảnh bìa và ${imageMatches?.length || 0} ảnh minh họa.` : `Sử dụng ảnh mặc định.`, {
      url: imageUrl
    });

    // 5. Giai đoạn Lưu trữ (Staging)
    await createAutomationLog('Staging', 'INFO', `Đang đẩy bài viết vào hệ thống CMS...`);
    const draftResult = await createAIDraft({
      title: topic,
      content: finalContent,
      excerpt: seo?.excerpt,
      image_url: imageUrl || '',
      meta_title: seo?.meta_title,
      meta_description: seo?.meta_description,
      keywords: seo?.keywords
    });

    if (!draftResult.success) throw new Error(`CMS Error: ${draftResult.error}`);
    await createAutomationLog('Staging', 'GEN', `Đã lưu Bản nháp thành công (Slug: ${draftResult.slug})`, {
      slug: draftResult.slug,
      draft_id: draftResult.id
    });

    // 6. Giai đoạn Lập lịch (Scheduling)
    if (GOOGLE_KEY) {
      createSchedulingEvent({
        title: `[POST] ${topic}`,
        description: `Bản nháp AI: /admin/posts/edit/${draftResult.slug}`,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
        apiKey: GOOGLE_KEY as string
      }).then(() => createAutomationLog('Scheduling', 'SUCCESS', `Đã đồng bộ lên Google Calendar.`))
        .catch(e => createAutomationLog('Scheduling', 'WARNING', `Lỗi đồng bộ lịch: ${e.message}`));
    }

    return { 
      success: true, 
      data: {
        topic,
        content: finalContent,
        research: researchResult,
        slug: draftResult.slug,
        image_url: imageUrl
      }
    };

  } catch (error: any) {
    console.error('Master Pipeline Error:', error);
    await createAutomationLog('System', 'ERROR', `Pipeline thất bại: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Giai đoạn 1 của Phê duyệt lặp: Tạo Dàn ý
 */
export async function generateContentOutline(topic: string, selectedFiles: string[] = []) {
  if (!await checkAdmin()) throw new Error('Unauthorized');

  const settings = await getAutomationSettings();
  const getSetting = (key: string) => settings.find(s => s.key_name === key)?.key_value;
  const PERPLEXITY_KEY = getSetting('PERPLEXITY_API_KEY');
  const GEMINI_KEY = getSetting('GEMINI_API_KEY');

  try {
    await createAutomationLog('Knowledge', 'INFO', `Đang lập dàn ý cho: ${topic}...`);
    
    // 1. Nghiên cứu nhanh
    const internalKnowledge = await queryInternalKnowledge(topic, selectedFiles);
    
    let researchResult = "";
    if (PERPLEXITY_KEY) {
      researchResult = await researchTopic(`${topic}\n\nNgữ cảnh: ${internalKnowledge}`, PERPLEXITY_KEY);
    } else {
      await createAutomationLog('Research', 'INFO', `Chế độ Tiết kiệm: Gemini sẽ tự nghiên cứu chủ đề này.`);
      researchResult = "Sử dụng Google Search để nghiên cứu sâu về chủ đề này.";
    }

    // 2. Tạo dàn ý qua Gemini
    const MODEL = getSetting('AI_MODEL_PREFERENCE') || 'gemini-1.5-pro';
    const prompt = `
      Dựa trên dữ liệu nghiên cứu sau:
      ---
      ${researchResult}
      ---
      Hãy tạo một dàn ý chi tiết (Outline) cho bài viết blog về "${topic}". 
      Định dạng trả về là một danh sách các đề mục H2, H3 kèm theo mô tả ngắn gọn nội dung mỗi phần.
      Yêu cầu: Tiếng Việt, logic, thu hút.
    `;

    const outline = await writeBlogPost(researchResult, topic, "Professional Strategist", GEMINI_KEY || '', MODEL);
    
    return { 
      success: true, 
      data: {
        outline: outline.content,
        research: researchResult
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Giai đoạn 2 của Phê duyệt lặp: Viết bài chi tiết từ Dàn ý đã duyệt
 */
export async function runFullContentPipelineFromOutline(topic: string, outline: string, researchData: string) {
  if (!await checkAdmin()) throw new Error('Unauthorized');

  const settings = await getAutomationSettings();
  const getSetting = (key: string) => settings.find(s => s.key_name === key)?.key_value;
  const GEMINI_KEY = getSetting('GEMINI_API_KEY');
  const WRITING_STYLE = getSetting('WRITING_STYLE') || 'Senior Robotics Engineer (Standard)';
  const GOOGLE_KEY = getSetting('GOOGLE_CLOUD_API_KEY');

  try {
    // 0. Tạo ảnh song song
    const imageTask = generateImage(`${topic}, high quality digital art, cyberpunk technical style`);

    // 1. Lấy ngữ cảnh liên kết nội bộ
    const internalLinks = await getInternalLinksContext();

    // 2. Viết bài từ dàn ý
    await createAutomationLog('Generation', 'INFO', `Đang triển khai bài viết chi tiết từ dàn ý đã duyệt...`);
    const CITATION_STYLE = settings.find(s => s.key_name === 'CITATION_TEMPLATE')?.key_value || '[Tên file]';
    const MODEL = settings.find(s => s.key_name === 'AI_MODEL_PREFERENCE')?.key_value || 'gemini-1.5-pro';
    
    const writingPrompt = `
      Hãy viết bài blog chi tiết dựa trên:
      - Dàn ý: ${outline}
      - Dữ liệu nghiên cứu: ${researchData}
      - Liên kết nội bộ: ${internalLinks}
      
      Yêu cầu bổ sung: 
      Cuối bài viết, hãy thêm mục "Tham khảo" sử dụng định dạng: ${CITATION_STYLE}.
      Dữ liệu tham khảo lấy từ các nguồn trong nghiên cứu trên.
    `;

    const initialResult = await writeBlogPost(writingPrompt, topic, WRITING_STYLE, GEMINI_KEY || '', MODEL);
    
    // 2.1. AI Proofreading (Bước kiểm soát chất lượng)
    await createAutomationLog('Generation', 'INFO', `Đang tiến hành Proofreading và Fact-check...`);
    const refinedContent = await proofreadContent(initialResult.content, topic);
    
    // 2.2. Xử lý Ảnh bìa từ văn bản
    let coverPrompt = topic; // Mặc định dùng topic
    const coverMatch = refinedContent.match(/\[COVER_IMAGE: (.*?)\]/);
    if (coverMatch) {
      coverPrompt = coverMatch[1];
      await createAutomationLog('Visuals', 'INFO', `Đã tìm thấy mô tả ảnh bìa riêng biệt: ${coverPrompt}`);
    }

    // Tạo ảnh bìa dựa trên prompt mới (nếu có)
    const finalImageTask = generateImage(`${coverPrompt}, high quality digital art, cyberpunk technical style`);

    // Xóa thẻ [COVER_IMAGE] khỏi nội dung để không hiển thị ra ngoài
    let finalContent = refinedContent.replace(/\[COVER_IMAGE: .*?\]/, '');
    const seo = initialResult.seo;

    // 3. Xử lý ảnh minh họa nội bộ (như cũ)
    const imageMatches = finalContent.match(/\[IMAGE: (.*?)\]/g);
    if (imageMatches) {
      for (const match of imageMatches) {
        const description = match.replace('[IMAGE: ', '').replace(']', '');
        const inlineImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(description + ', cyberpunk style, professional photography')}?width=800&height=450&model=flux&nologo=true`;
        finalContent = finalContent.replace(match, `\n\n![${description}](${inlineImageUrl})\n\n`);
      }
    }

    // Chuyển đổi Markdown sang HTML
    const htmlContent = await marked.parse(finalContent);

    const imageUrl = await finalImageTask;

    // 4. Lưu vào CMS
    const draftResult = await createAIDraft({
      title: topic,
      content: htmlContent, // Lưu nội dung đã chuyển đổi
      excerpt: seo?.excerpt,
      image_url: imageUrl || '',
      meta_title: seo?.meta_title,
      meta_description: seo?.meta_description,
      keywords: seo?.keywords
    });

    // 5. Lập lịch
    if (GOOGLE_KEY && draftResult.success) {
      const startTime = new Date(Date.now() + 86400000); // Ngày mai
      const endTime = new Date(startTime.getTime() + 3600000); // 1 giờ sau
      
      createSchedulingEvent({
        title: `[POST] ${topic}`,
        description: `Bản nháp AI: /admin/posts/edit/${draftResult.slug}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        apiKey: GOOGLE_KEY as string
      }).catch(() => {});
    }

    return { 
      success: true, 
      data: {
        slug: draftResult.slug
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Giai đoạn 3: AI Proofreading & Fact-check
 */
export async function proofreadContent(content: string, topic: string) {
  if (!await checkAdmin()) throw new Error('Unauthorized');

  const settings = await getAutomationSettings();
  const GEMINI_KEY = settings.find(s => s.key_name === 'GEMINI_API_KEY' || s.key_name === 'GEMINI_AI_ENDPOINT')?.key_value;

  try {
    // Sử dụng persona "Strict Senior Editor" để tinh chỉnh bài viết
    const result = await writeBlogPost(content, `HÃY KIỂM TRA LỖI CHÍNH TẢ, NGỮ PHÁP VÀ TINH CHỈNH VĂN PHONG CHO BÀI VIẾT VỀ: ${topic}`, "Strict Senior Editor", GEMINI_KEY || '');
    return result.content;
  } catch (error) {
    console.error('Proofreading failed:', error);
    return content; 
  }
}
