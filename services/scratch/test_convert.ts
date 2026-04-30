import { marked } from 'marked';

const content = `## Mở Đầu: Số Hóa Di Sản Phi Vật Thể Qua Lăng Kính Công Nghệ Robotics Và Trí Tuệ Nhân Tạo
Trong diễn ngôn học thuật về bảo tồn di sản, việc lưu giữ các giá trị văn hóa vật thể (tangible heritage) như kiến trúc hay cổ vật thường được chú trọng bằng các phương pháp vật lý...

---
## 1. Ngăn Chặn "Ảo Giác AI" Nhằm Bảo Vệ Tính Toàn Vẹn Của Tri Thức Lịch Sử
Khi ứng dụng các Mô hình Ngôn ngữ Lớn (Large Language Models - LLMs) vào lĩnh vực học thuật và lịch sử, rủi ro nghiêm trọng nhất là hiện tượng "Ảo giác" (Hallucination)...

### 1.1. Kiến Trúc Grounding Dựa Trên Nguồn Sự Thật Duy Nhất (Single Source of Truth)
Để đảm bảo tính toàn vẹn của dữ liệu, dự án thiết lập một ranh giới tri thức nghiêm ngặt thông qua nền tảng Google NotebookLM...

**Đoạn mã mô phỏng (Code Block Test):**
\`\`\`javascript
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://192.168.1.100:1883');
client.on('message', (topic, message) => {
    console.log('Nhận lệnh cơ khí!');
});
\`\`\`

---
## Kết Luận
Việc bảo tồn và phát huy di sản văn hóa phi vật thể không chỉ dừng lại ở việc số hóa tài liệu thô cứng...`;

async function test() {
    const html = await marked.parse(content);
    console.log("=========================================");
    console.log("🚀 KẾT QUẢ CHUYỂN ĐỔI HTML (PREVIEW):");
    console.log("=========================================");
    console.log(html.substring(0, 1500) + "..."); // In ra 1500 ký tự đầu để Quân xem
}

test();
