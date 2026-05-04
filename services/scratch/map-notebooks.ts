import { chromium } from 'playwright';

async function main() {
  const userDataDir = '/Users/mac/Library/Application Support/notebooklm-mcp/chrome_profile';
  const context = await chromium.launchPersistentContext(userDataDir, { headless: true });
  const page = await context.newPage();
  await page.goto('https://notebooklm.google.com/', { waitUntil: 'networkidle' });
  await new Promise(r => setTimeout(r, 5000));

  const notebooks = await page.evaluate(() => {
    // NotebookLM thường hiển thị danh sách trong một div grid
    // Tìm các link notebook
    const links = Array.from(document.querySelectorAll('a[href*="/notebook/"]'));
    
    return links.map(a => {
      const url = (a as HTMLAnchorElement).href;
      const id = url.split('/').pop()?.split('?')[0];
      
      // Thường tên notebook nằm trong một div bên cạnh link hoặc link bao quanh nó
      // Chúng ta thử lấy text content của tổ tiên gần nhất có nhiều text
      let container = a.parentElement;
      while (container && container.textContent && container.textContent.length < 5) {
        container = container.parentElement;
      }
      
      const fullText = container?.innerText || '';
      const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
      
      // Tên thường là dòng đầu tiên sau icon/prefix
      let name = lines[0] || 'Unknown';
      if (name.includes('more_vert')) {
         name = lines[1] || lines[0];
      }

      return { name, id, url };
    }).filter(nb => nb.id);
  });

  console.log(JSON.stringify(notebooks, null, 2));
  await context.close();
}

main().catch(console.error);
