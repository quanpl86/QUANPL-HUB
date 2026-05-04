import { chromium } from 'playwright';
import fs from 'fs';
import { supabase } from '../supabase-client.js';

// Hàm slugify chuẩn
function slugify(text: string) {
  const from = "áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ·/_,:;";
  const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd------";
  let str = text.toLowerCase().trim();
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }
  return str
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function main() {
  const userDataDir = '/Users/mac/Library/Application Support/notebooklm-mcp/chrome_profile';
  const libraryPath = '/Users/mac/Library/Application Support/notebooklm-mcp/library.json';

  console.log('🌐 Bước 1: Đang quét Google NotebookLM...');
  const context = await chromium.launchPersistentContext(userDataDir, { headless: true });
  const page = await context.newPage();
  
  try {
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'networkidle', timeout: 60000 });
    await new Promise(r => setTimeout(r, 7000)); // Chờ load hoàn tất

    const scraped = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/notebook/"]'));
      return links.map(a => {
        const url = (a as HTMLAnchorElement).href;
        const id = url.split('/').pop()?.split('?')[0];
        let container = a.parentElement;
        while (container && container.textContent && container.textContent.length < 5) {
          container = container.parentElement;
        }
        const lines = (container?.innerText || '').split('\n').map(l => l.trim()).filter(l => l.length > 5);
        let name = lines[0] || 'Unknown';
        if (name.includes('more_vert')) name = lines[1] || lines[0];
        return { name, id, url };
      }).filter(nb => nb.id);
    });

    console.log(`✅ Đã tìm thấy ${scraped.length} notebooks.`);

    console.log('📂 Bước 2: Cập nhật Library Local...');
    const notebooksForLibrary = scraped.map(nb => ({
      id: nb.id,
      name: nb.name,
      description: `Auto-synced: ${nb.name}`,
      url: nb.url,
      topics: [], use_cases: [], tags: []
    }));

    // Thêm ánh xạ cho Worker cũ (Hardcoded dựa trên dữ liệu đã biết)
    const legacyMappings = [
      { slug: 'robot-h-ng-d-n-vi-n-b-o-t-ng-t', realId: '4ae8fe58-b432-416f-8f9d-8b8b601fa6bd', name: 'Robot Hướng Dẫn Viên Bảo Tàng' },
      { slug: 'gi-o-n-stem-robotics-l-p-tr-nh', realId: 'eee0e1ce-5506-4110-bead-b11b91fbf8fe', name: 'Giáo án STEM Robotics' }
    ];

    legacyMappings.forEach(m => {
        notebooksForLibrary.push({
            id: m.slug,
            name: `${m.name} (Legacy)`,
            description: `Legacy mapping to ${m.realId}`,
            url: `https://notebooklm.google.com/notebook/${m.realId}`,
            topics: [], use_cases: [], tags: []
        });
    });

    fs.writeFileSync(libraryPath, JSON.stringify({
      notebooks: notebooksForLibrary,
      active_notebook_id: null,
      last_modified: new Date().toISOString(),
      version: "1.0.0"
    }, null, 2));

    console.log('⚡ Bước 3: Đẩy dữ liệu lên Supabase (Chế độ CLEAN)...');
    
    // Xóa toàn bộ dữ liệu cũ để tránh "bóng ma"
    const { error: deleteError } = await supabase
      .from('automation_notebooks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Xóa tất cả

    if (deleteError) {
      console.warn('⚠️ Cảnh báo xóa dữ liệu cũ:', deleteError.message);
    } else {
      console.log('🗑️ Đã xóa sạch dữ liệu cũ trên Supabase.');
    }

    const supabaseRecords = scraped.map(nb => ({
      id: slugify(nb.name),
      name: nb.name,
      description: `Real ID: ${nb.id}`,
      updated_at: new Date().toISOString()
    }));

    // Thêm legacy vào Supabase
    legacyMappings.forEach(m => {
        supabaseRecords.push({
            id: m.slug,
            name: `${m.name} (Legacy)`,
            description: `Real ID: ${m.realId}`,
            updated_at: new Date().toISOString()
        });
    });

    const { error } = await supabase.from('automation_notebooks').insert(supabaseRecords);

    if (error) throw error;
    console.log('✨ HOÀN TẤT: Hệ thống đã được làm sạch và đồng bộ mới!');

  } catch (err: any) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await context.close();
  }
}

main();
