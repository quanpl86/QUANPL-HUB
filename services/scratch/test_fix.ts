import { marked } from 'marked';
import fs from 'fs';

const fullContent = `## Mở Đầu: Số Hóa Di Sản Phi Vật Thể Qua Lăng Kính Công Nghệ Robotics Và Trí Tuệ Nhân Tạo Trong diễn ngôn học thuật về bảo tồn di sản, việc lưu giữ các giá trị văn hóa vật thể (tangible heritage)... --- ## 1. Ngăn Chặn "Ảo Giác AI" Nhằm Bảo Vệ Tính Toàn Vẹn Của Tri Thức Lịch Sử Khi ứng dụng các Mô hình Ngôn ngữ Lớn (Large Language Models - LLMs)...`;

async function convertWithFix() {
    console.log("⏳ Đang thực hiện chuyển đổi với cơ chế FIX tiêu đề dính liền...");
    
    // Áp dụng Regex fix giống như trong Worker
    const fixedContent = fullContent.replace(/(#{1,6}\s+.*?)(\s+[^#\s])/g, '$1\n\n$2');
    
    const html = await marked.parse(fixedContent);
    fs.writeFileSync('/Users/mac/Downloads/QUAN-PL-HUB/services/scratch/full_result_fixed.html', html);
    console.log("✅ Hoàn tất! Quân hãy mở file: services/scratch/full_result_fixed.html");
}

convertWithFix();
