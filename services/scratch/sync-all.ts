import fs from 'fs';
import path from 'path';
import { supabase } from '../supabase-client.js';

// Hàm slugify từ supabase-client.ts
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

const notebooksRaw = [
  { "name": "Giáo án STEM Robotics: Lập trình Robot AI Walker Chinh phục", "id": "eee0e1ce-5506-4110-bead-b11b91fbf8fe" },
  { "name": "THE_FINAL_GLORY_OF_SYNC", "id": "76544299-d49a-4220-80b6-15ee28fa6411" },
  { "name": "Huyền Thoại Chiến Binh Bất Tử", "id": "c6757782-749f-41d0-b1d1-49fd5c4b8c7d" },
  { "name": "Thể lệ Cuộc thi World GreenMech 2026: Vườn Bách thảo Thông minh", "id": "4b5bfcf8-3fd9-4278-a3ed-d9656fcb0604" },
  { "name": "Robot Hướng Dẫn Viên Bảo Tàng Thông Minh LEGO Gemini AI", "id": "4ae8fe58-b432-416f-8f9d-8b8b601fa6bd" },
  { "name": "Quy chế Cuộc thi Robot World GreenMech 2026", "id": "d07247e0-56fb-49e1-a092-9120bb5ee1cd" },
  { "name": "Quy chế Cuộc thi World GreenMech 2026: Robot for Mission", "id": "4be4260b-abca-4b20-b47e-58fbcaf0b97a" },
  { "name": "Nghệ Thuật Thiết Kế Bài Tập Thực Hành Cho Sách", "id": "4b0b2c62-4dc0-4dcf-9aee-773eff542aa6" },
  { "name": "Giáo Trình Thực Hành SQL Server", "id": "2dba726d-ff34-4f93-9f43-d5ecf2c2475a" },
  { "name": "Thể Lệ Cuộc Thi Cyber City", "id": "31bb4642-3d61-4afa-bb93-544968e4ea5f" },
  { "name": "Mini World Game Design: Module 7", "id": "d48f6e62-f040-40ce-a3ed-905fd81d6681" },
  { "name": "AI Module 1 Robot User Manual", "id": "1bc32ad3-0dd7-4a2c-8728-6ec397120a80" },
  { "name": "2025WRO-GRG_MRI", "id": "4fab87d9-78ac-460d-9b23-822574fa959d" },
  { "name": "GRG 2025 Mobile Robotics I Challenge Booklet", "id": "b49357b8-cd76-4903-98ef-4f7d3c7cc709" },
  { "name": "Building a Treadmill Robot", "id": "feab0b99-d18e-4caa-9759-e594c50b52c0" }
];

async function main() {
  console.log('🚀 Đang bắt đầu đồng bộ hóa toàn diện...');

  const libraryPath = '/Users/mac/Library/Application Support/notebooklm-mcp/library.json';
  
  // 1. Chuẩn bị dữ liệu cho library.json
  const notebooks = notebooksRaw.map(nb => ({
    id: nb.id,
    name: nb.name,
    description: `Auto-synced: ${nb.name}`,
    url: `https://notebooklm.google.com/notebook/${nb.id}`,
    topics: [],
    use_cases: [],
    tags: []
  }));

  // Thêm legacy notebooks vào library.json
  notebooks.push({
    id: 'robot-h-ng-d-n-vi-n-b-o-t-ng-t',
    name: 'Robot Hướng Dẫn Viên Bảo Tàng Thông Minh LEGO Gemini AI (Legacy)',
    description: 'Legacy ID mapping for worker',
    url: 'https://notebooklm.google.com/notebook/4ae8fe58-b432-416f-8f9d-8b8b601fa6bd',
    topics: [],
    use_cases: [],
    tags: []
  });

  notebooks.push({
    id: 'gi-o-n-stem-robotics-l-p-tr-nh',
    name: 'Giáo án STEM Robotics: Lập trình Robot AI Walker Chinh phục (Legacy)',
    description: 'Legacy ID mapping for worker',
    url: 'https://notebooklm.google.com/notebook/eee0e1ce-5506-4110-bead-b11b91fbf8fe',
    topics: [],
    use_cases: [],
    tags: []
  });

  const libraryData = {
    notebooks: notebooks,
    active_notebook_id: null,
    last_modified: new Date().toISOString(),
    version: "1.0.0"
  };

  fs.writeFileSync(libraryPath, JSON.stringify(libraryData, null, 2));
  console.log('✅ Đã cập nhật library.json local.');

  // 2. Đồng bộ lên Supabase
  console.log('⏳ Đang đồng bộ lên Supabase...');
  
  // Chúng ta sử dụng SLUG làm ID trên Supabase để khớp với Worker cũ
  // Hoặc ta có thể dùng UUID? 
  // User nói ID trên Supabase không đúng, nên ta sẽ cập nhật chúng.
  
  const records = notebooksRaw.map(nb => ({
    id: slugify(nb.name), // Dùng slug mới chuẩn
    name: nb.name,
    description: `Real ID: ${nb.id}`,
    updated_at: new Date().toISOString()
  }));

  // Thêm legacy slugs cho Worker hiện tại
  records.push({
    id: 'robot-h-ng-d-n-vi-n-b-o-t-ng-t',
    name: 'Robot Hướng Dẫn Viên Bảo Tàng Thông Minh LEGO Gemini AI (Legacy)',
    description: 'Real ID: 4ae8fe58-b432-416f-8f9d-8b8b601fa6bd',
    updated_at: new Date().toISOString()
  });

  records.push({
    id: 'gi-o-n-stem-robotics-l-p-tr-nh',
    name: 'Giáo án STEM Robotics: Lập trình Robot AI Walker Chinh phục (Legacy)',
    description: 'Real ID: eee0e1ce-5506-4110-bead-b11b91fbf8fe',
    updated_at: new Date().toISOString()
  });

  const { error } = await supabase
    .from('automation_notebooks')
    .upsert(records, { onConflict: 'id' });

  if (error) {
    console.error('❌ Lỗi Supabase:', error.message);
  } else {
    console.log('✅ Đã đồng bộ 15 notebooks lên Supabase thành công!');
  }
}

main().catch(console.error);
