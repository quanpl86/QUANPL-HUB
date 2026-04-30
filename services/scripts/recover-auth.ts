import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.resolve(rootDir, '.env');

console.log('====================================================');
console.log('🚀 KHỞI ĐỘNG CÔNG CỤ CỨU HỘ BẢO MẬT NOTEBOOKLM');
console.log('====================================================\n');

// 1. ĐỌC FILE ENV
if (!fs.existsSync(envPath)) {
  console.error('❌ Lỗi: Không tìm thấy file .env tại', envPath);
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf8');

// 2. DỌN DẸP BÓNG MA CHROME
console.log('🧹 Bước 1: Dọn dẹp tiến trình rác và file Lock...');
try {
  execSync('pkill -9 -f "Chromium" || true');
  execSync('pkill -9 -f "chrome" || true');
  execSync('pkill -9 -f "Google Chrome" || true');
  
  const mcpDataDir = '/Users/mac/Library/Application Support/notebooklm-mcp';
  execSync(`rm -rf "${mcpDataDir}/.context-creation.lock" || true`);
  execSync(`rm -rf "${mcpDataDir}/SingletonLock" || true`);
  execSync(`rm -rf "${mcpDataDir}/chrome_profile/SingletonLock" || true`);
  execSync(`rm -rf "${mcpDataDir}/chrome_profile_instances" || true`);
  execSync(`rm -rf "${mcpDataDir}/browser_state" || true`);
  console.log('   ✅ Đã dọn dẹp sạch sẽ toàn bộ rác và Cookie hỏng!');
} catch (e) {
  // Ignored
}

// 3. TẮT TÀNG HÌNH
console.log('\n🔓 Bước 2: Chuyển đổi chế độ HEADLESS thành hiển thị (false)...');
const newEnv = envContent.replace(/HEADLESS=true/g, 'HEADLESS=false');
if (newEnv !== envContent) {
  fs.writeFileSync(envPath, newEnv);
  console.log('   ✅ Đã cập nhật file .env tạm thời.');
} else {
  console.log('   ℹ️  Chế độ hiển thị đã được bật sẵn.');
}

// 4. KÍCH HOẠT ĐĂNG NHẬP
console.log('\n🚀 Bước 3: Đang khởi động trình duyệt bảo mật của MCP...');
try {
  // Chạy script con để kết nối MCP
  execSync('npx tsx scripts/_trigger-auth.ts', { 
    cwd: rootDir,
    stdio: 'inherit' 
  });
} catch (e) {
  console.log('\nℹ️  Tiến trình đăng nhập đã được đóng bởi người dùng.');
}

// 5. TRẢ LẠI TÀNG HÌNH
console.log('\n🔒 Bước 4: Khôi phục lại chế độ HEADLESS (tàng hình)...');
fs.writeFileSync(envPath, envContent);
console.log('   ✅ Đã khôi phục file .env gốc.');

console.log('\n====================================================');
console.log('🎉 QUÁ TRÌNH CỨU HỘ HOÀN TẤT!');
console.log('Hệ thống đã lưu lại Cookies mới. Bạn có thể tiếp tục sử dụng.');
console.log('Khởi động lại tiến trình chính bằng: npm run dev');
console.log('====================================================\n');
