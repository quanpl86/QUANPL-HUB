import 'dotenv/config';
import { setupAuth } from '../mcp-client.js';

async function run() {
  console.log('⏳ Đang kết nối với MCP Server để mở form đăng nhập...');
  try {
    const result = await setupAuth();
    console.log('✅ Kết nối thành công! Đã gửi lệnh mở giao diện Auth.');
    console.log('----------------------------------------------------');
    console.log('👉 HƯỚNG DẪN:');
    console.log('1. Một cửa sổ Google Chrome vừa được mở ra.');
    console.log('2. Hãy đăng nhập tài khoản Google của bạn vào đó.');
    console.log('3. Đợi trang NotebookLM hiện ra hoàn toàn.');
    console.log('4. Quay lại cửa sổ Terminal này và bấm tổ hợp phím [Ctrl + C] để kết thúc.');
    console.log('----------------------------------------------------');
    
    // Giữ cho process sống để trình duyệt không bị đóng
    setInterval(() => {}, 1000);
  } catch (err) {
    console.error('❌ Lỗi khi gọi setupAuth:', err);
    process.exit(1);
  }
}

run();
