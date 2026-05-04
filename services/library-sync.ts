import { chromium } from 'playwright';
import fs from 'fs';
import { supabase } from './supabase-client.js';

/**
 * Hàm chuẩn hóa tên Notebook (loại bỏ rác UI)
 */
function cleanNotebookName(lines: string[]) {
  const noise = ['more_vert', 'add', 'create new notebook', 'shared', 'public', 'sources', '🔄', '🤖'];
  const cleanLines = lines.filter(l => {
    const isDate = /^[A-Z][a-z]{2}\s\d{1,2},\s\d{4}$/.test(l);
    const isNoise = noise.some(n => l.toLowerCase().includes(n.toLowerCase()));
    const isSourceCount = /\d+\s+source/.test(l.toLowerCase());
    return l.length > 0 && !isDate && !isNoise && !isSourceCount;
  });

  let name = cleanLines[0] || 'Unknown Notebook';
  if (name.length < 5 && cleanLines[1]) {
    name = name + ' ' + cleanLines[1];
  }

  // Fix cứng cho các trường hợp đặc biệt nếu cần
  if (name === '🏃‍♀️') name = '🏃‍♀️ Building a Treadmill Robot';

  return name;
}

/**
 * Hàm thực hiện đồng bộ toàn diện: Google -> Local -> Supabase
 */
export async function syncLibraryWithGoogle() {
  const userDataDir = '/Users/mac/Library/Application Support/notebooklm-mcp/chrome_profile';
  const libraryPath = '/Users/mac/Library/Application Support/notebooklm-mcp/library.json';

  console.log('[Sync] 🔄 Bắt đầu tự động cập nhật danh sách Notebook từ Google...');

  const context = await chromium.launchPersistentContext(userDataDir, { headless: true });
  const page = await context.newPage();

  try {
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'networkidle', timeout: 30000 });
    await new Promise(r => setTimeout(r, 7000));

    const scraped = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/notebook/"]'));
      return links.map(a => {
        const url = (a as HTMLAnchorElement).href;
        const id = url.split('/').pop()?.split('?')[0];
        let container = a.parentElement;
        while (container && container.textContent && container.textContent.length < 5) {
          container = container.parentElement;
        }
        const lines = (container?.innerText || '').split('\n').map(l => l.trim());
        return { lines, id, url };
      }).filter(nb => nb.id);
    });

    const finalNotebooks = scraped.map(nb => ({
      id: nb.id as string,
      name: cleanNotebookName(nb.lines),
      url: nb.url
    }));

    console.log(`[Sync] ✅ Đã quét xong ${finalNotebooks.length} Notebooks.`);

    // 1. Cập nhật Local Library
    const libraryData = {
      notebooks: finalNotebooks.map(nb => ({
        id: nb.id,
        name: nb.name,
        description: `Auto-synced: ${nb.name}`,
        url: nb.url,
        topics: [], use_cases: [], tags: []
      })),
      active_notebook_id: null,
      last_modified: new Date().toISOString(),
      version: "1.0.0"
    };
    fs.writeFileSync(libraryPath, JSON.stringify(libraryData, null, 2));

    // 2. Cập nhật Supabase (Xóa cũ - Ghi mới)
    console.log('[Sync] ⚡ Đang cập nhật dữ liệu chuẩn lên Supabase...');
    await supabase.from('automation_notebooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const supabaseRecords = finalNotebooks.map(nb => ({
      id: nb.id,
      name: nb.name,
      description: `Google Notebook UUID: ${nb.id}`,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('automation_notebooks').insert(supabaseRecords);
    if (error) throw error;

    console.log('[Sync] ✨ Hoàn tất đồng bộ tự động.');
    return true;

  } catch (error: any) {
    console.error('[Sync] ❌ Lỗi đồng bộ tự động:', error.message);
    return false;
  } finally {
    await context.close();
  }
}
