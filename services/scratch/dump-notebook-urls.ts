import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const userDataDir = '/Users/mac/Library/Application Support/notebooklm-mcp/chrome_profile';
  
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
  });

  const page = await context.newPage();
  await page.goto('https://notebooklm.google.com/', { waitUntil: 'networkidle' });
  await new Promise(r => setTimeout(r, 5000));

  console.log('[Dump] Đang tìm kiếm URLs của notebooks...');
  
  const notebooks = await page.evaluate(() => {
    // Tìm tất cả các thẻ <a> hoặc các div có vai trò là link/button
    const links = Array.from(document.querySelectorAll('a[href*="/notebook/"]'));
    return links.map(a => ({
      name: a.textContent?.trim().split('\n')[0].trim(),
      url: (a as HTMLAnchorElement).href,
      id: (a as HTMLAnchorElement).href.split('/').pop()?.split('?')[0]
    }));
  });

  console.log('[Dump] Notebooks found:');
  console.log(JSON.stringify(notebooks, null, 2));

  await context.close();
}

main().catch(console.error);
