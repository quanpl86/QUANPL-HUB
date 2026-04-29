/**
 * Image Generation Service
 */

export async function generateImage(prompt: string, provider: string = 'pollinations') {
  console.log(`Đang tạo hình ảnh với ${provider} cho prompt: ${prompt}`);

  try {
    if (provider === 'pollinations') {
      // Pollinations.ai là dịch vụ miễn phí, không cần API Key, rất tốt cho demo
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&model=flux&nologo=true`;
      return imageUrl;
    }

    // Tương lai có thể mở rộng sang DALL-E hoặc Stability AI
    return null;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

/**
 * Hàm lấy ảnh chất lượng cao từ Unsplash (Dành cho ảnh stock thực tế)
 */
export async function getUnsplashImage(query: string, apiKey: string) {
  if (!apiKey) return null;
  
  try {
    const response = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${apiKey}`);
    const data = await response.json();
    return data.urls?.regular || null;
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    return null;
  }
}
