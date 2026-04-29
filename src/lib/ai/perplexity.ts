/**
 * Perplexity AI Service for DeepSearch Research
 */

export async function researchTopic(query: string, apiKey: string) {
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY_MISSING');
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-reasoning-pro', // Hoặc 'sonar' tùy cấu hình
        messages: [
          {
            role: 'system',
            content: 'Bạn là một trợ lý nghiên cứu chuyên sâu. Hãy cung cấp thông tin chính xác, có dẫn nguồn và phân tích đa chiều về chủ đề được yêu cầu.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Perplexity API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling Perplexity:', error);
    throw error;
  }
}
