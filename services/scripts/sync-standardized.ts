import { chromium } from 'playwright';
import fs from 'fs';
import { supabase } from '../supabase-client.js';

async function main() {
  const userDataDir = '/Users/mac/Library/Application Support/notebooklm-mcp/chrome_profile';
  const libraryPath = '/Users/mac/Library/Application Support/notebooklm-mcp/library.json';

  console.log('🔍 Bước 1: Quét dữ liệu chuẩn từ Google...');
  const context = await chromium.launchPersistentContext(userDataDir, { headless: true });
  const page = await context.newPage();
  
  try {
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'networkidle' });
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
        const fullText = container?.innerText || '';
        const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        const noise = ['more_vert', 'add', 'create new notebook', 'shared', 'public', 'sources', '🔄', '🤖'];
        
        const cleanLines = lines.filter(l => {
          const isDate = /^[A-Z][a-z]{2}\s\d{1,2},\s\d{4}$/.test(l);
          const isNoise = noise.some(n => l.toLowerCase().includes(n.toLowerCase()));
          const isSourceCount = /\d+\s+source/.test(l.toLowerCase());
          return !isDate && !isNoise && !isSourceCount;
        });

        // Ghép các dòng ngắn (thường là icon/emoji) với dòng text chính
        let name = '';
        if (cleanLines.length > 0) {
          if (cleanLines[0].length < 5 && cleanLines[1]) {
            name = cleanLines[0] + ' ' + cleanLines[1];
          } else {
            name = cleanLines[0];
          }
        } else {
          name = 'Unknown Notebook';
        }

        return { name, id, url };
      }).filter(nb => nb.id && nb.name !== 'Unknown Notebook');
    });

    // Hậu kiểm: Sửa các tên chưa chuẩn (ví dụ chỉ có emoji)
    const finalNotebooks = scraped.map(nb => {
      if (nb.name === '🏃‍♀️') nb.name = '🏃‍♀️ Building a Treadmill Robot';
      return nb;
    });

    console.log(`✅ Tìm thấy ${finalNotebooks.length} Notebooks với UUID chuẩn.`);

    console.log('📂 Bước 2: Cập nhật Library Local (UUID Mode)...');
    const libraryData = {
      notebooks: finalNotebooks.map(nb => ({
        id: nb.id,
        name: nb.name,
        description: `Official Notebook: ${nb.name}`,
        url: nb.url,
        topics: [], use_cases: [], tags: []
      })),
      active_notebook_id: null,
      last_modified: new Date().toISOString(),
      version: "1.0.0"
    };
    fs.writeFileSync(libraryPath, JSON.stringify(libraryData, null, 2));

    console.log('⚡ Bước 3: Chuẩn hóa Supabase (Xóa cũ - Ghi mới UUID)...');
    await supabase.from('automation_notebooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const supabaseRecords = finalNotebooks.map(nb => ({
      id: nb.id,
      name: nb.name,
      description: `Google Notebook UUID: ${nb.id}`,
      updated_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase.from('automation_notebooks').insert(supabaseRecords);
    if (insertError) throw insertError;

    console.log('✨ THÀNH CÔNG: Dữ liệu đã được chuẩn hóa 100% sang mã UUID.');

    // Tìm ID của Robot Hướng Dẫn Viên để cập nhật .env
    const robotNB = scraped.find(n => n.name.includes('Robot Hướng Dẫn Viên') || n.id === '4ae8fe58-b432-416f-8f9d-8b8b601fa6bd');
    if (robotNB) {
      console.log(`📌 UUID của Robot Notebook: ${robotNB.id}`);
    }

  } catch (err: any) {
    console.error('❌ Lỗi chuẩn hóa:', err.message);
  } finally {
    await context.close();
  }
}

main();
