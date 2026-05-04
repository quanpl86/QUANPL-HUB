import { chromium } from 'playwright';

async function main() {
  const userDataDir = '/Users/mac/Library/Application Support/notebooklm-mcp/chrome_profile';
  
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
  });

  const page = await context.newPage();
  await page.goto('https://notebooklm.google.com/', { waitUntil: 'networkidle' });
  await new Promise(r => setTimeout(r, 5000));

  console.log('[Dump] Đang trích xuất thông tin chi tiết notebooks...');
  
  const notebooks = await page.evaluate(() => {
    // NotebookLM thường hiển thị notebooks trong một grid
    // Tìm các thẻ có chứa link /notebook/
    const items = Array.from(document.querySelectorAll('a[href*="/notebook/"]'));
    
    return items.map(item => {
      // Tìm text bên trong item này, thường là tên notebook
      // Chúng ta lấy text content và dọn dẹp các ký tự thừa (như ngày tháng, số lượng nguồn)
      const text = item.textContent?.trim() || '';
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const href = (item as HTMLAnchorElement).href;
      const id = href.split('/').pop()?.split('?')[0];
      
      return {
        name: lines[0] || 'Unknown',
        id,
        url: href,
        fullText: text
      };
    });
  });

  console.log(JSON.stringify(notebooks, null, 2));

  await context.close();
}

main().catch(console.error);
