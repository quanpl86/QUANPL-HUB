import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const userDataDir = '/Users/mac/Library/Application Support/notebooklm-mcp/chrome_profile';
  
  console.log('[Dump] Khởi động trình duyệt với profile:', userDataDir);
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
  });

  const page = await context.newPage();
  console.log('[Dump] Đang mở NotebookLM...');
  await page.goto('https://notebooklm.google.com/', { waitUntil: 'networkidle' });
  
  console.log('[Dump] Chờ 5 giây để load notebooks...');
  await new Promise(r => setTimeout(r, 5000));

  const content = await page.content();
  console.log('[Dump] Đã lấy được HTML. Đang tìm kiếm notebook names...');
  
  // Tìm các phần tử có khả năng là tên notebook
  const notebookNames = await page.evaluate(() => {
    // Thường NotebookLM dùng Angular hoặc React, tên có thể nằm trong div hoặc span cụ thể
    const elements = Array.from(document.querySelectorAll('div, span, a'));
    return elements
      .map(el => el.textContent?.trim())
      .filter(text => text && text.length > 5 && text.length < 100)
      .slice(0, 50);
  });

  console.log('[Dump] Các text tìm thấy:', notebookNames);

  await context.close();
}

main().catch(console.error);
