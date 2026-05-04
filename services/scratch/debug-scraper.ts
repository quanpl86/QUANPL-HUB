import { chromium } from 'playwright';

async function main() {
  const userDataDir = '/Users/mac/Library/Application Support/notebooklm-mcp/chrome_profile';
  const context = await chromium.launchPersistentContext(userDataDir, { headless: true });
  const page = await context.newPage();
  await page.goto('https://notebooklm.google.com/', { waitUntil: 'networkidle' });
  await new Promise(r => setTimeout(r, 5000));

  console.log('[Debug] Đang tìm kiếm các khối notebook...');
  
  const items = await page.evaluate(() => {
    // NotebookLM dùng các thẻ có aria-label hoặc các cấu trúc grid
    // Chúng ta tìm tất cả các thẻ <a> có chứa /notebook/
    const links = Array.from(document.querySelectorAll('a[href*="/notebook/"]'));
    
    return links.map(a => {
      // Lấy text của cha hoặc các phần tử xung quanh nếu text bên trong <a> trống
      let name = a.textContent?.trim() || '';
      if (!name) {
        // Thử tìm trong các thẻ div anh em hoặc cha
        const parent = a.closest('div');
        name = parent?.textContent?.trim() || '';
      }
      
      // Dọn dẹp name: NotebookLM thường để tên + ngày tháng + số nguồn
      // Ví dụ: "My Notebook\nJan 1, 2024\n5 sources"
      const cleanName = name.split('\n')[0].trim();
      
      return {
        name: cleanName,
        url: (a as HTMLAnchorElement).href,
        id: (a as HTMLAnchorElement).href.split('/').pop()?.split('?')[0]
      };
    });
  });

  console.log(JSON.stringify(items, null, 2));
  await context.close();
}

main().catch(console.error);
