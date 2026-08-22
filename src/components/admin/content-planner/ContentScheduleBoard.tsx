'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  Edit3,
  Eye,
  FileText,
  ListPlus,
  PlayCircle,
  Plus,
  RotateCcw,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  clearContentSchedules,
  createContentInstruction,
  createContentSchedule,
  createContentSchedules,
  deleteContentInstruction,
  deleteContentSchedule,
  updateContentInstruction,
  updateContentScheduleDate,
  updateContentSchedulePreviousContext,
  updateContentSchedulePrompt,
  updateContentScheduleStatus,
  type ContentInstruction,
  type ContentReferencePost,
  type ContentScheduleInput,
  type ContentScheduleItem,
  type ContentScheduleStatus,
} from '@/app/actions/content-schedules';

const SAMPLE_PLAN = `1)
- Bài post trước đó (Nội dung mô tả ngắn): Giới thiệu hybrid 5E→PBL, decision matrix, workflow cơ bản.
- Tên bài post tiếp theo: Template Rubric STEM: Map Bloom → NGSS → ISTE → CSTA (CSV/JSON tải về)
- Nội dung mô tả: Bộ rubric chuẩn 4 trục (Conceptual, Functionality, Design, Collaboration) kèm mapping sang Bloom verb và tiêu chí NGSS/ISTE/CSTA; file mẫu CSV/JSON + hướng dẫn import vào LMS/GitHub Classroom.
- Mục tiêu: Cung cấp template có thể dùng ngay để chấm điểm và tự động hóa đánh giá.
- Đối tượng: Giáo viên STEM, admin LMS, thiết kế bài học.

2)
- Bài post trước đó: Workflow triển khai sprint & MVP.
- Tên bài post tiếp theo: Sprint-based PBL: Lịch trình 6 tuần, milestones & rubrics chi tiết
- Nội dung mô tả: Plan 6 tuần (sprint 1–3), checklist từng sprint, deliverable mẫu, lịch dạy tiết, mẫu lesson plan 45/90 phút.
- Mục tiêu: Giúp GV tái tạo dự án hoàn chỉnh theo timeline thực tế.
- Đối tượng: Giáo viên thực tế, trường học muốn áp dụng PBL.

3)
- Bài post trước đó: Scaffold công nghệ & prompt bank LLM.
- Tên bài post tiếp theo: Prompt Bank cho STEM Class: Explain, Starter Code, Debug, Reflection (mẫu + best practices)
- Nội dung mô tả: Bộ prompt theo role (teacher/student/assessor), mẫu prompt cho giải thích khái niệm, sinh starter-code Arduino/Python, debug prompts, prompts cho peer review và reflection.
- Mục tiêu: Giảm thời gian chuẩn bị cho GV và tăng hiệu quả sử dụng LLM trong lớp.
- Đối tượng: Giáo viên STEM, tutor, coach EdTech.

4)
- Bài post trước đó: Tech stack & CI suggestions.
- Tên bài post tiếp theo: Auto-grading cho STEM Projects: GitHub Actions + Unit Tests mẫu
- Nội dung mô tả: Hướng dẫn cấu hình GitHub Actions để chạy unit tests, đo lường sensor output, auto-report; repo mẫu + YAML templates.
- Mục tiêu: Tự động hoá phần kiểm tra kỹ thuật, tiết kiệm thời gian chấm bài.
- Đối tượng: Giáo viên có kỹ năng code, coordinators edtech, devs triển khai.

5)
- Bài post trước đó: Prototyping tools (Tinkercad, Wokwi).
- Tên bài post tiếp theo: Rapid Prototyping STEM: Tinkercad → Physical Build — checklist phần cứng & sourcing
- Nội dung mô tả: Quy trình chuyển mô phỏng sang phần cứng, danh sách vật tư tiêu chuẩn (BOM), cách mua sắm tiết kiệm, test plan, giải pháp thay thế khi thiếu linh kiện.
- Mục tiêu: Giảm rủi ro build phần cứng, tăng tỉ lệ hoàn thành prototype.
- Đối tượng: Giáo viên maker, lab techs, coordinators.

6)
- Bài post trước đó: Case study lớp 9 báo trộm.
- Tên bài post tiếp theo: Case Studies: 5 Hybrid Projects (kịch bản, rubrics, repo, video demo)
- Nội dung mô tả: 5 case studies thực tế (IoT báo trộm, weather station, energy-efficient lamp, plant sensor, STEM storytelling robot) kèm kế hoạch, repo mẫu, rubric và link demo.
- Mục tiêu: Cung cấp mô hình copy/paste cho GV để triển khai ngay.
- Đối tượng: Giáo viên STEM, trainers, workshop facilitators.

7)
- Bài post trước đó: Mapping standards & assessment.
- Tên bài post tiếp theo: Chuẩn hoá learning outcomes: từ standard đến assessment (workshop + worksheet)
- Nội dung mô tả: Phương pháp chuyển NGSS/ISTE/CSTA vào LO cụ thể; worksheet mẫu để dùng trong workshop thiết kế bài học; templates cho learning evidence.
- Mục tiêu: Chuẩn hóa LO để đảm bảo alignment giữa tiêu chuẩn và đánh giá.
- Đối tượng: Curriculum designers, lead teachers, school admins.

8)
- Bài post trước đó: Kết hợp AI & tooling.
- Tên bài post tiếp theo: Ethics & Academic Integrity khi dùng LLM trong lớp STEM
- Nội dung mô tả: Chính sách classroom về dùng AI, mẫu honor code, rubric đánh giá tính nguyên bản, kỹ thuật kiểm tra output LLM, pedagogical uses vs. cheating.
- Mục tiêu: Giảm rủi ro misuse và thiết lập quy tắc rõ ràng cho học sinh.
- Đối tượng: Giáo viên, school policy makers, phụ huynh.

9)
- Bài post trước đó: Workflow + CI + auto assessment.
- Tên bài post tiếp theo: Build a Starter Repo for STEM Projects — README, tests, GitHub Classroom template
- Nội dung mô tả: Repo mẫu có README cho học sinh, test suite đơn giản, GitHub Classroom setup guide, issues template, PR review checklist.
- Mục tiêu: Cho phép triển khai dự án code/hardware nhanh cho lớp.
- Đối tượng: Teachers with coding projects, devs hỗ trợ giáo dục.

10)
- Bài post trước đó: Case studies & product “wow” discussion.
- Tên bài post tiếp theo: When to Prioritize “Wow”: Cost-Benefit Matrix for Product Features in Student Projects
- Nội dung mô tả: Decision framework giúp chọn feature ‘wow’ (visual, UX, social impact) dựa trên thời gian, learning outcomes, kỹ năng required; ví dụ apply trên 3 dự án.
- Mục tiêu: Giúp giáo viên quyết định feature nào đáng đầu tư để vừa “wow” vừa học được kiến thức.
- Đối tượng: Teachers, curriculum leads, program managers.

11)
- Bài post trước đó: Hybrid 5E→PBL và pedagogy.
- Tên bài post tiếp theo: From Concept to Capability: Long-term Curriculum Design using 5E+PBL (K-12 roadmap)
- Nội dung mô tả: Roadmap 1–3 năm cho trường hoặc chương trình, progression of competencies, assessment checkpoints, resource planning.
- Mục tiêu: Hỗ trợ lãnh đạo trường xây chương trình STEM liên tục theo competency progression.
- Đối tượng: School leaders, curriculum designers, district admins.

12)
- Bài post trước đó: Prompt bank & AI integration.
- Tên bài post tiếp theo: LLM-assisted Reflection & Metacognition: Templates to Improve Student Learning
- Nội dung mô tả: Prompts và workflow dùng LLM để hỗ trợ self-explanation, error analysis, lab report drafting; rubrics cho reflection; ví dụ output trước/sau.
- Mục tiêu: Nâng cao hiệu quả học tập thông qua metacognitive scaffolds do AI hỗ trợ.
- Đối tượng: Giáo viên, instructional coaches, học sinh trung học.`;

const MASTER_RULE = `# CHỈ THỊ MASTER: TỰ ĐỘNG HÓA SẢN XUẤT NỘI DUNG CHUYÊN SÂU & TỐI ƯU HÓA AI SEARCH (GEO/AIO)

## 1. ĐỊNH VỊ PHONG CÁCH VÀ GÓC NHÌN TÁC GIẢ
- **Góc nhìn thực chiến:** Bài viết phải được viết dưới góc nhìn của một chuyên gia EdTech, một Trainer STEM kiêm Full-stack Developer đã trực tiếp triển khai, thử nghiệm và tối ưu hóa các dự án công nghệ thực tế.
- **Giọng văn:** Chuyên nghiệp, sắc sảo, có chiều sâu học thuật nhưng mang tính ứng dụng cao. Đưa ra câu trả lời trực diện, không lan man lý thuyết suông.
- **Mật độ thông tin (Information Density):** Cao. Sử dụng ngôn ngữ khúc chiết. Ưu tiên các định dạng dễ trích xuất (Extractable Formats) như gạch đầu dòng, bảng biểu để tối ưu hóa cho AI Search (Google SGE, Perplexity).
- **Kỷ luật ký tự:** Sử dụng ký tự Unicode tiêu chuẩn (ví dụ: →, Schema). Hạn chế dùng Emoji trong thân bài học thuật.

---

## 2. BỘ KHUNG ĐÓNG GÓI DỮ LIỆU ĐẦU RA (MANDATORY SEO & SYSTEM CONFIG)
Mỗi bài viết XUẤT BẢN BẮT BUỘC phải tuân thủ cấu trúc đóng gói Metadata nghiêm ngặt ở đầu tài liệu:

---
[HỆ THỐNG TỰ ĐỘNG HÓA - CONFIG]
- Email nhận thông báo: [plquan.86@gmail.com](mailto:plquan.86@gmail.com)
- Trạng thái tác vụ: Sẵn sàng xuất bản (Ready to Publish)
- Thư mục lưu trữ: KingDragonHub/Blog/[Ten-Chu-De-Viet-Lien-Khong-Dau]

[SEO & AIO META DATA]
- Cụm từ khóa chính (Focus Keyword): [Xác định 1 từ khóa cốt lõi]
- Tiêu đề Meta (Meta Title): [Từ khóa chính ở đầu. Độ dài: 50-60 ký tự]
- Mô tả Meta (Meta Description): [Tóm tắt hấp dẫn + chứa từ khóa chính. Độ dài nghiêm ngặt: 120-145 ký tự]
- Đoạn trích dẫn (Excerpt): [Đoạn dẫn nhập thu hút. Bắt buộc chứa Semantic keywords. Độ dài: 50-100 ký tự]
- Từ khóa ngữ nghĩa (Keywords): [10-15 từ khóa LSI / Entity liên quan trực tiếp đến ngữ cảnh, cách nhau bằng dấu phẩy]
- Alt Text Ảnh Bìa (Cover Image Alt): [Mô tả chi tiết ảnh bìa chứa từ khóa chính]
---

[QUẢN LÝ TÀI NGUYÊN HÌNH ẢNH MINH HỌA (INLINE IMAGES)]
- Ảnh Minh họa 1: [Mã định danh, vd: image_1.png]
  + Prompt Gen Ảnh: [Prompt tiếng Anh chi tiết, phong cách Cyberpunk/Tech]
  + Alt Text: [Mô tả chi tiết kỹ thuật của ảnh, chứa LSI keyword]
  + Chú thích (Caption): [Dòng giải thích ngắn gọn hiển thị dưới ảnh]
---

## 3. GIAO THỨC TỐI ƯU HÓA AI SEARCH (GEO PROTOCOL)
Để bài viết được các LLM/AI (Perplexity, ChatGPT, SGE) ưu tiên bóc tách làm câu trả lời:
- **Nguyên tắc "Đáy tháp ngược":** Đưa kết luận và định nghĩa quan trọng nhất lên đầu (Phần Key Takeaways).
- **Xác thực thực thể (E-E-A-T):** Trích dẫn rõ ràng tên tổ chức (vd: Vercel, OpenAI), framework, bài báo khoa học hoặc thuật ngữ kỹ thuật chuyên ngành để tăng Authority Score.
- **Cấu trúc phân cấp hình học:** Tuân thủ tuyệt đối chuẩn Semantic HTML: H1 -> H2 -> H3. Không bao giờ được dùng H3 nếu chưa có H2.

---

## 4. KHUNG CẤU TRÚC THÂN BÀI VIẾT TIÊU CHUẨN (BẮT BUỘC TUÂN THỦ)

# [Tiêu đề bài viết - Bắt buộc chứa Focus Keyword, giật tít chuyên gia]

### [Đoạn trích dẫn ngắn (Excerpt) làm sa-pô mở đầu bài viết]

---
[BLOCK: KEY TAKEAWAYS - PHỤC VỤ TRÍCH XUẤT AI]
*(Ghi chú cho AI: Bắt buộc tạo ra 3-4 gạch đầu dòng cô đọng nhất tóm tắt giải pháp/định nghĩa cốt lõi của bài viết. Dùng ngôn từ khẳng định, trực diện).*
- Ý chính 1: ...
- Ý chính 2: ...
- Ý chính 3: ...
---

## 1. Góc Nhìn Thực Chiến: Trải Nghiệm Và Điểm Nghẽn
- Phân tích điểm nghẽn kỹ thuật / sai lầm phổ biến dưới góc nhìn người đã triển khai thực tế.

## 2. Cơ Sở Học Thuật & Bản Chất Công Nghệ
- Phân tích sâu về thuật toán, kiến trúc hệ thống, hoặc nguyên lý nền tảng.
- *[VỊ TRÍ CHÈN ẢNH X - Copy thông tin từ mục Quản lý hình ảnh vào đây]*

## 3. Quy Trình Thực Hành Triển Khai (Workflow)
- Sử dụng danh sách đánh số (1, 2, 3...) chuẩn xác. Mỗi bước bao gồm: Tiêu đề bước, Hành động cụ thể và Cảnh báo lỗi (Gotchas).
- *[VỊ TRÍ CHÈN ẢNH Y]*

## 4. Đúc Kết Và Nguồn Cảm Hứng
- Khẳng định giá trị dài hạn của công nghệ.
- > [Chèn một câu trích dẫn Blockquote mang tính triết lý hoặc nhận định từ chuyên gia/tổ chức hàng đầu]

---
[BLOCK: FAQ - TẠO SCHEMA.ORG CHO GOOGLE & SGE]
*(Ghi chú cho AI: Sinh ra đúng 3 câu hỏi thường gặp nhất liên quan đến chủ đề, định dạng theo form dưới đây để Editor dễ dàng copy vào khối FAQ).*
**Hỏi: [Câu hỏi phổ biến thực tế từ người dùng/lập trình viên?]**
**Đáp:** [Câu trả lời đi thẳng vào vấn đề, khoảng 2-3 câu ngắn gọn].

**Hỏi: [Câu hỏi so sánh, ví dụ X khác Y thế nào?]**
**Đáp:** [Phân tích điểm khác biệt cốt lõi].
---

**Nguồn tham chiếu nghiên cứu (Citations):**
1. *[Tên tổ chức/Tác giả, Năm, Tên tài liệu/Tên Docs]*
2. *[Link tham khảo hoặc GitHub Repo (nếu có)]*`;

const PRODUCTION_SAFE_EDITORIAL_RULE = `# MASTER INSTRUCTION v5 — PRODUCTION SAFE EDITORIAL SYSTEM

## AI CONTENT GENERATION SYSTEM FOR GEO/AIO + BLOG EDITOR COMPATIBILITY

---

# 1. MỤC TIÊU HỆ THỐNG

AI phải tạo ra:

* bài viết chuyên sâu,
* chuẩn học thuật,
* tối ưu SEO/GEO/AIO,
* nhưng KHÔNG được phá vỡ định dạng hiển thị của Blog Editor.

Ưu tiên:

1. Editor compatibility
2. Stable rendering
3. Semantic consistency
4. SEO/GEO optimization
5. Human readability

---

# 2. QUY TẮC BẮT BUỘC VỀ ĐỊNH DẠNG

## KHÔNG được:

* tự tạo syntax mới
* tự tạo pseudo-block
* dùng custom markdown
* dùng nested markdown phức tạp
* dùng HTML ngoài yêu cầu
* thay đổi định dạng block cố định

## Chỉ sử dụng:

* Header markdown chuẩn:
  * \`#\`
  * \`##\`
  * \`###\`
* Bullet list chuẩn
* Number list chuẩn
* Blockquote markdown \`>\`
* Markdown link chuẩn:
  * \`[Tên](https://example.com)\`

---

# 3. BLOCK SYSTEM — KHÔNG ĐƯỢC THAY ĐỔI

## BLOCK 1 — KEY TAKEAWAYS

PHẢI GIỮ NGUYÊN 100% ĐỊNH DẠNG:

\`\`\`md
---
[BLOCK: KEY TAKEAWAYS - PHỤC VỤ TRÍCH XUẤT AI]
*(Ghi chú cho AI: Bắt buộc tạo ra 3-4 gạch đầu dòng cô đọng nhất tóm tắt giải pháp/định nghĩa cốt lõi của bài viết. Dùng ngôn từ khẳng định, trực diện).*
- Ý chính 1: ...
- Ý chính 2: ...
- Ý chính 3: ...
---
\`\`\`

## QUY TẮC:

* Không đổi tên BLOCK
* Không thêm markdown khác vào block
* Không thêm heading trong block
* Không thêm numbering
* Không thêm table
* Không thêm emoji
* Không đổi separator \`---\`

---

## BLOCK 2 — FAQ

PHẢI GIỮ NGUYÊN 100% ĐỊNH DẠNG:

\`\`\`md
---
[BLOCK: FAQ - TẠO SCHEMA.ORG CHO GOOGLE & SGE]
*(Ghi chú cho AI: Sinh ra đúng 3 câu hỏi thường gặp nhất liên quan đến chủ đề, định dạng theo form dưới đây để Editor dễ dàng copy vào khối FAQ).*
**Hỏi: [Câu hỏi phổ biến thực tế từ người dùng/lập trình viên?]**
**Đáp:** [Câu trả lời đi thẳng vào vấn đề, khoảng 2-3 câu ngắn gọn].

**Hỏi: [Câu hỏi so sánh, ví dụ X khác Y thế nào?]**
**Đáp:** [Phân tích điểm khác biệt cốt lõi].
---
\`\`\`

## QUY TẮC:

* Chỉ dùng:
  * \`**Hỏi:**\`
  * \`**Đáp:**\`
* Không thêm bullet
* Không thêm numbering
* Không thêm sub-heading
* Không thêm markdown lồng nhau
* Không thêm HTML

---

# 4. HEADER STRUCTURE RULES

## Chỉ dùng:

\`\`\`md
# H1
## H2
### H3
\`\`\`

## KHÔNG:

* skip heading level
* dùng H4 trở xuống
* dùng heading giả bằng bold text

## Cấu trúc chuẩn:

\`\`\`md
# Tiêu đề bài viết

### Sa-pô mở đầu

## 1. Section lớn

### Sub-section

## 2. Section lớn
\`\`\`

---

# 5. LINK & CITATION POLICY

## MỌI THAM CHIẾU:

PHẢI:

* có nguồn thật,
* link thật,
* đúng nội dung mô tả,
* còn hoạt động.

## ƯU TIÊN:

1. Official docs
2. Research organizations
3. Standards organizations
4. GitHub official repos
5. University resources

---

# 6. FORMAT LINK BẮT BUỘC

## Chỉ dùng markdown link chuẩn:

\`\`\`md
[Tên nguồn](https://example.com)
\`\`\`

## KHÔNG:

* raw URL
* fake URL
* shortened URL
* placeholder URL

---

# 7. CITATION VALIDATION RULE

Trước khi xuất:
AI PHẢI:

* kiểm tra link khớp nội dung mô tả
* không hallucinate source
* không tạo citation giả
* không tạo research paper giả

## Ví dụ đúng:

\`\`\`md
[NGSS Standards](https://www.nextgenscience.org/)
\`\`\`

## Ví dụ sai:

\`\`\`md
[NGSS Research Portal](https://ngss-research-ai-learning.org)
\`\`\`

(nếu link không tồn tại thật)

---

# 8. SEO & GEO RULES

## Meta Title

* 50–60 ký tự
* keyword gần đầu
* readable
* không keyword stuffing

## Meta Description

* 120–145 ký tự
* tự nhiên
* answer-first

## Excerpt

* 50–100 ký tự
* dễ hiển thị card preview

---

# 9. CONTENT STYLE RULES

## Bài viết phải:

* thực chiến,
* có chiều sâu,
* actionable,
* implementation-oriented.

## Tránh:

* lý thuyết suông,
* motivational fluff,
* generic AI phrasing,
* buzzword overload.

---

# 10. HUMAN READABILITY RULES

## Nếu dùng thuật ngữ:

Ví dụ:

* CI/CD
* MVP
* scaffold
* rubric
* auto-grading

→ phải giải thích ngắn khi xuất hiện lần đầu.

---

# 11. WORKFLOW SECTION RULE

## Workflow phải dùng:

\`\`\`md
1.
- Hành động:
- Công cụ:
- Gotchas:
\`\`\`

## KHÔNG:

* prose dài liên tục
* nested numbering phức tạp

---

# 12. IMAGE SECTION RULE

\`\`\`md
[QUẢN LÝ TÀI NGUYÊN HÌNH ẢNH MINH HỌA]
- Ảnh Minh họa 1:
  + Prompt Gen Ảnh:
  + Alt Text:
  + Chú thích:
\`\`\`

## Style ưu tiên:

* minimal
* flat
* clean infographic
* educational
* low visual noise

---

# 13. CONTENT DIFFERENTIATION RULE

Mỗi bài phải có ít nhất:

* 1 framework,
* hoặc matrix,
* hoặc workflow,
* hoặc implementation insight riêng.

Không viết lại nội dung phổ biến trên internet.

---

# 14. CASE STUDY RULE

Nếu dùng dữ liệu nội bộ:
Phải ghi rõ:

\`\`\`md
(Dữ liệu nội bộ từ chương trình triển khai thực tế)
\`\`\`

---

# 15. FINAL OUTPUT CHECKLIST

Trước khi xuất:
AI PHẢI kiểm tra:

* Đúng định dạng KEY TAKEAWAYS block
* Đúng định dạng FAQ block
* Heading hierarchy đúng
* Markdown render-safe
* Không có custom syntax
* Link hoạt động đúng
* Citation đúng nguồn
* Không hallucinate
* Không phá editor formatting

Nếu sai:
→ sửa trước khi xuất nội dung.

---

# 16. OUTPUT GOAL

Mục tiêu cuối:

* render đúng trên blog editor,
* parser-safe,
* schema-friendly,
* GEO/AIO optimized,
* dễ đọc với con người,
* và đủ chiều sâu chuyên môn để xây authority lâu dài.`;

const BLOG_CMS_SAFE_GEO_AIO_RULE = `# MASTER INSTRUCTION v6 — BLOG CMS SAFE GEO/AIO EDITORIAL SYSTEM

## 1. MỤC TIÊU HỆ THỐNG

AI phải tạo ra bài viết:

* chuyên sâu,
* chuẩn học thuật,
* tối ưu SEO/GEO/AIO,
* nhưng tuyệt đối tương thích với Blog Editor/CMS parser.

Output phải:

* parser-safe,
* deterministic,
* không phá vỡ rendering,
* không thay đổi flow trình bày chuẩn.

---

# 2. QUY TẮC TƯƠNG THÍCH BLOG EDITOR

## Editor sẽ tự động tách:

* Tiêu đề bài viết
* Excerpt
* Metadata
* SEO Matrix
* Nội dung Body
* FAQ Schema
* Citations

→ Vì vậy AI KHÔNG được thay đổi:

* tên block,
* thứ tự block,
* separator,
* heading hierarchy.

---

# 3. OUTPUT FLOW — BẮT BUỘC TUÂN THỦ

## THỨ TỰ OUTPUT BẮT BUỘC:

\`\`\`md
[HỆ THỐNG TỰ ĐỘNG HÓA - CONFIG]

[SEO & AIO META DATA]

[QUẢN LÝ TÀI NGUYÊN HÌNH ẢNH MINH HỌA]

# Tiêu đề bài viết

### Excerpt

[BLOCK: KEY TAKEAWAYS]

## Nội dung body

[BLOCK: FAQ]

[Citations]
\`\`\`

KHÔNG được:

* đảo thứ tự,
* thêm section chen ngang,
* đổi tên block.

---

# 4. METADATA SYSTEM — KHÔNG ĐƯỢC THAY ĐỔI FORMAT

## PHẢI GIỮ NGUYÊN:

\`\`\`md
---
[HỆ THỐNG TỰ ĐỘNG HÓA - CONFIG]
- Email nhận thông báo:
- Trạng thái tác vụ:
- Thư mục lưu trữ:

[SEO & AIO META DATA]
- Cụm từ khóa chính (Focus Keyword):
- Tiêu đề Meta (Meta Title):
- Mô tả Meta (Meta Description):
- Đoạn trích dẫn (Excerpt):
- Từ khóa ngữ nghĩa (Keywords):
- Alt Text Ảnh Bìa (Cover Image Alt):
---
\`\`\`

## MAPPING VỚI BLOG EDITOR

| Metadata         | Mapping                       |
| ---------------- | ----------------------------- |
| Focus Keyword    | SEO Matrix → Keyword          |
| Meta Title       | SEO Matrix → Meta Title       |
| Meta Description | SEO Matrix → Meta Description |
| Keywords         | Tags                          |
| Cover Image Alt  | Alt text                      |
| Excerpt          | Dẫn nhập                      |

---

# 5. IMAGE MANAGEMENT SYSTEM — BẮT BUỘC

## PHẢI LUÔN CÓ:

\`\`\`md
[QUẢN LÝ TÀI NGUYÊN HÌNH ẢNH MINH HỌA]
- Ảnh Minh họa 1:
  + Prompt Gen Ảnh:
  + Alt Text:
  + Chú thích:
\`\`\`

## QUY TẮC:

* Prompt phải bằng tiếng Anh
* Alt text phải:

  * mô tả đúng ảnh,
  * chứa keyword/LSI tự nhiên
* Caption:

  * ngắn,
  * giải thích đúng nội dung ảnh

---

# 6. IMAGE INSERTION PLACEHOLDER — BẮT BUỘC

## Trong body PHẢI có:

\`\`\`md
- *[VỊ TRÍ CHÈN ẢNH X - Copy thông tin từ mục Quản lý hình ảnh vào đây]*
\`\`\`

## QUY TẮC:

* Không đổi format
* Không đổi wording
* Không dùng HTML image
* Không embed markdown image

Editor sẽ tự inject image block.

---

# 7. HEADER STRUCTURE RULES

## CHỈ dùng:

\`\`\`md
# H1
## H2
### H3
\`\`\`

## KHÔNG:

* skip heading level
* dùng H4+
* fake heading bằng bold

---

# 8. ARTICLE BODY FLOW — BẮT BUỘC

## FLOW BODY CHUẨN:

\`\`\`md
# Tiêu đề bài viết

### Excerpt

---
[BLOCK: KEY TAKEAWAYS]
---

## 1. Góc Nhìn Thực Chiến

## 2. Cơ Sở Học Thuật & Bản Chất Công Nghệ

## 3. Quy Trình Thực Hành Triển Khai (Workflow)

## 4. Đúc Kết Và Nguồn Cảm Hứng

[DẪN NHẬP FAQ NGẮN]

---
[BLOCK: FAQ]
---

**Nguồn tham chiếu nghiên cứu (Citations):**
\`\`\`

---

# 9. KEY TAKEAWAYS BLOCK — KHÔNG ĐƯỢC PHÁ FORMAT

## PHẢI GIỮ NGUYÊN:

\`\`\`md
---
[BLOCK: KEY TAKEAWAYS - PHỤC VỤ TRÍCH XUẤT AI]
*(Ghi chú cho AI: Bắt buộc tạo ra 3-4 gạch đầu dòng cô đọng nhất tóm tắt giải pháp/định nghĩa cốt lõi của bài viết. Dùng ngôn từ khẳng định, trực diện).*
- Ý chính 1: ...
- Ý chính 2: ...
- Ý chính 3: ...
---
\`\`\`

## KHÔNG:

* thêm heading
* thêm numbering
* thêm table
* thêm markdown khác

---

# 10. FAQ BLOCK — KHÔNG ĐƯỢC PHÁ FORMAT

## FAQ PHẢI:

* nằm TRƯỚC Citations
* có đoạn dẫn nhập ngắn phía trên FAQ block

Ví dụ:

\`\`\`md
Dưới đây là những câu hỏi phổ biến nhất khi triển khai thực tế chủ đề này trong classroom hoặc workflow production.

---
[BLOCK: FAQ - TẠO SCHEMA.ORG CHO GOOGLE & SGE]
...
---
\`\`\`

---

# 11. FAQ FORMAT — GIỮ NGUYÊN 100%

\`\`\`md
---
[BLOCK: FAQ - TẠO SCHEMA.ORG CHO GOOGLE & SGE]
*(Ghi chú cho AI: Sinh ra đúng 3 câu hỏi thường gặp nhất liên quan đến chủ đề, định dạng theo form dưới đây để Editor dễ dàng copy vào khối FAQ).*
**Hỏi: ...**
**Đáp:** ...

**Hỏi: ...**
**Đáp:** ...
---
\`\`\`

---

# 12. CITATION SYSTEM — BẮT BUỘC

## FORMAT:

\`\`\`md
**Nguồn tham chiếu nghiên cứu (Citations):**
1. [Tên nguồn](https://...)
2. [Tên nguồn](https://...)
\`\`\`

---

# 13. LINK VALIDATION RULE

Mọi link:

* phải tồn tại thật,
* đúng nội dung mô tả,
* không placeholder,
* không fake URL.

## Ưu tiên:

1. Official docs
2. Universities
3. Standards organizations
4. GitHub official repos
5. Research organizations

---

# 14. SEO & GEO RULES

## Meta Title

* 50–60 ký tự
* keyword gần đầu

## Meta Description

* 120–145 ký tự
* answer-first

## Keywords

* 10–15 semantic keywords
* phân tách bằng dấu phẩy

---

# 15. CONTENT STYLE RULES

## Nội dung phải:

* practical,
* implementation-oriented,
* information-dense,
* snippet-friendly.

## Tránh:

* generic AI tone
* motivational fluff
* buzzword overload

---

# 16. WORKFLOW FORMAT RULE

## Workflow dùng:

\`\`\`md
1.
- Hành động:
- Công cụ:
- Gotchas:
\`\`\`

---

# 17. HUMAN READABILITY RULE

Nếu xuất hiện:

* CI/CD
* MVP
* scaffold
* rubric
* auto-grading

→ phải giải thích ngắn gọn lần đầu xuất hiện.

---

# 18. CASE STUDY RULE

Nếu dùng:

* số liệu,
* kết quả triển khai,
* metrics,

→ phải ghi rõ:

\`\`\`md
(Dữ liệu nội bộ từ chương trình triển khai thực tế)
\`\`\`

---

# 19. FINAL VALIDATION CHECKLIST

Trước khi xuất:
AI PHẢI kiểm tra:

* Đúng flow output
* Đúng metadata block
* Đúng image management block
* Có image insertion placeholders
* KEY TAKEAWAYS đúng format
* FAQ đúng format
* FAQ nằm trước Citations
* Heading hierarchy đúng
* Link hoạt động thật
* Citation đúng nguồn
* Markdown parser-safe
* Không custom syntax
* Không HTML lạ
* Không phá editor rendering

Nếu sai:
→ sửa trước khi xuất nội dung.

---

# 20. OUTPUT GOAL

Mục tiêu cuối:

* import vào editor không lỗi,
* auto mapping metadata đúng,
* body render đúng,
* FAQ schema extract đúng,
* SEO matrix parse đúng,
* image placeholders parse đúng,
* GEO/AIO optimized,
* và đủ chất lượng để xây authority content lâu dài.`;

const BUILT_IN_INSTRUCTIONS: ContentInstruction[] = [
  {
    id: 'builtin-master-geo-aio',
    name: 'Master GEO/AIO Editorial System',
    description: 'Instruction gốc cho bài chuyên sâu, SEO/GEO/AIO và cấu trúc metadata đầy đủ.',
    content: MASTER_RULE,
    isDefault: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'builtin-production-safe-v5',
    name: 'Production Safe Editorial System v5',
    description: 'Instruction an toàn cho editor: parser-safe, markdown-safe, kiểm soát block cố định và citation.',
    content: PRODUCTION_SAFE_EDITORIAL_RULE,
    isDefault: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'builtin-blog-cms-safe-v6',
    name: 'Blog CMS Safe GEO/AIO Editorial System v6',
    description: 'Instruction CMS-safe cho auto mapping metadata, FAQ schema, image placeholders và SEO Matrix.',
    content: BLOG_CMS_SAFE_GEO_AIO_RULE,
    isDefault: false,
    createdAt: '',
    updatedAt: '',
  },
];

const statusMeta: Record<ContentScheduleStatus, { label: string; icon: LucideIcon; tone: string }> = {
  draft: {
    label: 'Draft',
    icon: ClipboardList,
    tone: 'border-brand-orange/25 bg-brand-orange/[0.04]',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircle,
    tone: 'border-brand-orange/45 bg-brand-orange/[0.08]',
  },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    tone: 'border-green-500/35 bg-green-500/[0.06]',
  },
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);
}

function addWeeks(date: Date, weeks: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + weeks * 7);
  return next.toISOString().slice(0, 10);
}

function extractField(block: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`-\\s*${escapedLabel}(?:\\s*\\([^)]*\\))?\\s*:\\s*([\\s\\S]*?)(?=\\n-\\s*[^:]+:|$)`, 'i');
  return block.match(pattern)?.[1]?.replace(/\s+/g, ' ').trim() || '';
}

function parsePlan(rawPlan: string, startDate: string): ContentScheduleInput[] {
  const normalized = rawPlan.replace(/\r\n/g, '\n');
  const blocks = normalized
    .split(/\n(?=\d+\)\s*)/g)
    .map((block) => block.trim())
    .filter((block) => /^\d+\)/.test(block));

  return blocks.map((block, index) => {
    const order = Number(block.match(/^(\d+)\)/)?.[1] || index + 1);
    const title = extractField(block, 'Tên bài post tiếp theo') || `Bài post kế hoạch ${order}`;

    return {
      order,
      title,
      slug: slugify(title),
      previousContext: extractField(block, 'Bài post trước đó'),
      description: extractField(block, 'Nội dung mô tả'),
      goal: extractField(block, 'Mục tiêu'),
      audience: extractField(block, 'Đối tượng'),
      status: 'draft',
      scheduledDate: addWeeks(new Date(startDate), index),
      sourcePlan: block,
    };
  });
}

function formatDate(date: string) {
  if (!date) return 'Chưa đặt lịch';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

function buildPostBrief(item: ContentScheduleItem) {
  return `# POST BRIEF: ${item.title}

## Thông tin triển khai
- Thứ tự trong cluster: ${item.order}
- Ngày dự kiến xuất bản: ${item.scheduledDate || 'Chưa đặt lịch'}
- Trạng thái hiện tại: ${item.status}
- Slug đề xuất: ${item.slug}

## Nội dung mô tả bài post hiện tại
- Tiêu đề: ${item.title}
- Mô tả: ${item.description || 'Chưa có mô tả chi tiết.'}
- Bài trước liên quan: ${item.previousContext || 'Chưa có thông tin bài trước.'}
- Mục tiêu: ${item.goal || 'Chưa có mục tiêu cụ thể.'}
- Đối tượng: ${item.audience || 'Chưa có đối tượng cụ thể.'}

## Yêu cầu đầu ra bổ sung
- Viết thành bài blog hoàn chỉnh bằng Markdown, tương thích editor hiện tại của KING DRAGON HUB.
- Chủ động đề xuất Focus Keyword, Meta Title, Meta Description, Excerpt, Keywords và Cover Image Alt.
- Tạo nội dung có khả năng trở thành bài cluster hỗ trợ pillar content, ưu tiên tính thực chiến và khả năng tái sử dụng trong lớp học.
- Khi có bảng, dùng bảng Markdown rõ ràng. Khi có quy trình, dùng danh sách đánh số để editor có thể nhận diện workflow.
- Không tự bịa nguồn. Nếu chưa chắc nguồn, ghi rõ "cần xác minh" trong mục Citations.`;
}

function composePromptPack(rule: string, brief: string, context: string) {
  return `# AI AGENT PROMPT PACK

## CỤM 1: RULE / INSTRUCTION BẮT BUỘC
${rule.trim()}

---

## CỤM 2: POST BRIEF / DỮ LIỆU BÀI VIẾT CẦN TRIỂN KHAI
${brief.trim()}

---

## CỤM 3: CONTEXT BÀI VIẾT TRƯỚC ĐÓ ĐỂ THAM CHIẾU
${context.trim() || '[Chưa cung cấp nội dung bài viết trước đó. Hãy chỉ dựa trên Post Brief và không giả định chi tiết ngoài dữ kiện đã có.]'}

---

## NHIỆM VỤ CUỐI
Hãy tạo bài viết hoàn chỉnh theo đúng 3 cụm dữ liệu trên. Ưu tiên độ chính xác, cấu trúc rõ, metadata đầy đủ, nội dung tương thích editor và tối ưu SEO/GEO/AIO.`;
}

function mergeInstructionPresets(instructions: ContentInstruction[]) {
  const names = new Set(instructions.map((instruction) => instruction.name.toLowerCase()));
  return [
    ...instructions,
    ...BUILT_IN_INSTRUCTIONS.filter((instruction) => !names.has(instruction.name.toLowerCase())),
  ];
}

type ContentScheduleBoardProps = {
  initialItems: ContentScheduleItem[];
  initialPreviousArticleContent: string;
  initialInstructions: ContentInstruction[];
  initialReferencePosts: ContentReferencePost[];
  initialLoadError?: string;
};

export function ContentScheduleBoard({
  initialItems,
  initialPreviousArticleContent,
  initialInstructions,
  initialReferencePosts,
  initialLoadError = '',
}: ContentScheduleBoardProps) {
  const [items, setItems] = useState<ContentScheduleItem[]>(initialItems);
  const initialInstructionList = mergeInstructionPresets(initialInstructions);
  const hasHydrated = useRef(false);
  const [rawPlan, setRawPlan] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualTitle, setManualTitle] = useState('');
  const [previousArticleContent, setPreviousArticleContent] = useState(initialPreviousArticleContent);
  const [selectedReferencePostId, setSelectedReferencePostId] = useState('');
  const [instructions, setInstructions] = useState<ContentInstruction[]>(initialInstructionList);
  const [selectedInstructionId, setSelectedInstructionId] = useState(
    initialInstructionList.find((instruction) => instruction.isDefault)?.id || initialInstructionList[0]?.id || ''
  );
  const [promptItem, setPromptItem] = useState<ContentScheduleItem | null>(null);
  const [promptInstructionId, setPromptInstructionId] = useState(selectedInstructionId);
  const [promptRule, setPromptRule] = useState(MASTER_RULE);
  const [promptBrief, setPromptBrief] = useState('');
  const [promptContext, setPromptContext] = useState('');
  const [instructionModalMode, setInstructionModalMode] = useState<'create' | 'edit' | 'preview' | null>(null);
  const [instructionDraft, setInstructionDraft] = useState({
    id: '',
    name: '',
    description: '',
    content: '',
    isDefault: false,
  });

  useEffect(() => {
    if (initialLoadError) return;
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      return;
    }

    const timer = window.setTimeout(async () => {
      const result = await updateContentSchedulePreviousContext(previousArticleContent);
      if (!result.success) {
        toast.error(result.error || 'Không lưu được context bài trước lên Supabase.');
      }
    }, 800);

    return () => window.clearTimeout(timer);
  }, [initialLoadError, previousArticleContent]);

  const grouped = useMemo(() => {
    return (['draft', 'in_progress', 'done'] as ContentScheduleStatus[]).map((status) => ({
      status,
      items: items
        .filter((item) => item.status === status)
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.order - b.order),
    }));
  }, [items]);

  const stats = useMemo(() => ({
    total: items.length,
    draft: items.filter((item) => item.status === 'draft').length,
    inProgress: items.filter((item) => item.status === 'in_progress').length,
    done: items.filter((item) => item.status === 'done').length,
  }), [items]);

  const selectedInstruction = useMemo(() => (
    instructions.find((instruction) => instruction.id === selectedInstructionId) || instructions[0]
  ), [instructions, selectedInstructionId]);

  const promptInstruction = useMemo(() => (
    instructions.find((instruction) => instruction.id === promptInstructionId) || selectedInstruction
  ), [instructions, promptInstructionId, selectedInstruction]);

  const selectedReferencePost = useMemo(() => (
    initialReferencePosts.find((post) => post.id === selectedReferencePostId)
  ), [initialReferencePosts, selectedReferencePostId]);

  const importPlan = async () => {
    const parsedItems = parsePlan(rawPlan, startDate);
    if (parsedItems.length === 0) {
      toast.error('Không nhận diện được danh sách bài post. Hãy kiểm tra format đánh số 1), 2), 3)...');
      return;
    }

    const result = await createContentSchedules(parsedItems);
    if (!result.success) {
      toast.error(result.error || 'Không lưu được kế hoạch lên Supabase.');
      return;
    }

    setItems((current) => [...current, ...result.items]);
    setRawPlan('');
    toast.success(`Đã lưu ${result.items.length} bài vào Supabase.`);
  };

  const loadSamplePlan = () => {
    if (rawPlan.trim() && !confirm('Thay nội dung đang nhập bằng mẫu 12 bài chuẩn?')) return;
    setRawPlan(SAMPLE_PLAN);
    toast.success('Đã nạp mẫu 12 bài vào vùng nhập kế hoạch.');
  };

  const applyReferencePost = (postId: string) => {
    setSelectedReferencePostId(postId);
    const post = initialReferencePosts.find((item) => item.id === postId);
    if (!post) return;

    setPreviousArticleContent(`# ${post.title}

### Dẫn nhập / Excerpt
${post.excerpt || 'Bài viết chưa có excerpt.'}

### Trạng thái
${post.isPublished ? 'Công khai' : 'Bản nháp'}

### Slug
${post.slug}

---

${post.content}`);
    toast.success('Đã nạp bài viết đã chọn vào Context bài trước.');
  };

  const openInstructionModal = (mode: 'create' | 'edit' | 'preview', instruction?: ContentInstruction) => {
    const targetInstruction = instruction || selectedInstruction;

    setInstructionModalMode(mode);
    setInstructionDraft({
      id: mode === 'create' ? '' : targetInstruction?.id || '',
      name: mode === 'create' ? '' : targetInstruction?.name || '',
      description: mode === 'create' ? '' : targetInstruction?.description || '',
      content: mode === 'create' ? '' : targetInstruction?.content || '',
      isDefault: mode === 'create' ? false : Boolean(targetInstruction?.isDefault),
    });
  };

  const saveInstruction = async () => {
    if (!instructionDraft.name.trim() || !instructionDraft.content.trim()) {
      toast.error('Instruction cần có tên và nội dung.');
      return;
    }

    const payload = {
      name: instructionDraft.name.trim(),
      description: instructionDraft.description.trim(),
      content: instructionDraft.content,
      isDefault: instructionDraft.isDefault,
    };

    const shouldCreate = !instructionDraft.id || instructionDraft.id.startsWith('builtin-');
    const result = shouldCreate
      ? await createContentInstruction(payload)
      : await updateContentInstruction(instructionDraft.id, payload);

    if (!result.success || !result.instruction) {
      toast.error(result.error || 'Không lưu được instruction lên Supabase.');
      return;
    }

    setInstructions((current) => {
      const next = shouldCreate
        ? [result.instruction!, ...current.filter((instruction) => instruction.id !== instructionDraft.id)]
        : current.map((instruction) => (instruction.id === result.instruction!.id ? result.instruction! : instruction));

      return payload.isDefault
        ? next.map((instruction) => ({ ...instruction, isDefault: instruction.id === result.instruction!.id }))
        : next;
    });
    setSelectedInstructionId(result.instruction.id);
    setInstructionModalMode(null);
    toast.success('Đã lưu instruction vào Supabase.');
  };

  const removeInstruction = async () => {
    if (!selectedInstruction) return;
    if (selectedInstruction.id.startsWith('builtin-')) {
      toast.error('Instruction mặc định trong hệ thống không thể xóa khi chưa được lưu Supabase.');
      return;
    }
    if (!confirm(`Xóa instruction "${selectedInstruction.name}"?`)) return;

    const result = await deleteContentInstruction(selectedInstruction.id);
    if (!result.success) {
      toast.error(result.error || 'Không xóa được instruction.');
      return;
    }

    setInstructions((current) => current.filter((instruction) => instruction.id !== selectedInstruction.id));
    const fallbackInstruction = instructions.find((instruction) => instruction.id !== selectedInstruction.id);
    setSelectedInstructionId(fallbackInstruction?.id || '');
    toast.success('Đã xóa instruction.');
  };

  const updateStatus = async (id: string, status: ContentScheduleStatus) => {
    const previous = items;
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));

    const result = await updateContentScheduleStatus(id, status);
    if (!result.success) {
      setItems(previous);
      toast.error(result.error || 'Không cập nhật được trạng thái trên Supabase.');
    }
  };

  const updateDate = async (id: string, scheduledDate: string) => {
    const previous = items;
    setItems((current) => current.map((item) => (item.id === id ? { ...item, scheduledDate } : item)));

    const result = await updateContentScheduleDate(id, scheduledDate);
    if (!result.success) {
      setItems(previous);
      toast.error(result.error || 'Không cập nhật được lịch đăng trên Supabase.');
    }
  };

  const removeItem = async (id: string) => {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));

    const result = await deleteContentSchedule(id);
    if (!result.success) {
      setItems(previous);
      toast.error(result.error || 'Không xóa được lịch bài viết trên Supabase.');
    }
  };

  const clearBoard = async () => {
    if (!confirm('Xóa toàn bộ lịch trình nội dung hiện tại?')) return;
    const previous = items;
    setItems([]);

    const result = await clearContentSchedules();
    if (!result.success) {
      setItems(previous);
      toast.error(result.error || 'Không xóa được lịch trình trên Supabase.');
      return;
    }

    toast.success('Đã làm sạch lịch trình nội dung trên Supabase.');
  };

  const addManualItem = async () => {
    if (!manualTitle.trim()) {
      toast.error('Nhập tên bài post trước khi thêm.');
      return;
    }

    const order = items.length + 1;
    const result = await createContentSchedule({
      order,
      title: manualTitle.trim(),
      slug: slugify(manualTitle),
      previousContext: '',
      description: '',
      goal: '',
      audience: '',
      status: 'draft',
      scheduledDate: addWeeks(new Date(startDate), items.length),
    });

    if (!result.success || !result.item) {
      toast.error(result.error || 'Không thêm được bài vào Supabase.');
      return;
    }

    setItems((current) => [...current, result.item]);
    setManualTitle('');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'king-dragon-content-schedule.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const openPromptBuilder = (item: ContentScheduleItem) => {
    const itemInstruction = instructions.find((instruction) => instruction.id === item.promptInstructionId) || selectedInstruction;
    setPromptItem(item);
    setPromptInstructionId(itemInstruction?.id || '');
    setPromptRule(item.promptRule || itemInstruction?.content || MASTER_RULE);
    setPromptBrief(item.promptBrief || buildPostBrief(item));
    setPromptContext(item.promptContext || previousArticleContent);
  };

  const copyPromptPack = async () => {
    if (promptItem) {
      const result = await updateContentSchedulePrompt(promptItem.id, {
        promptRule,
        promptBrief,
        promptContext,
        promptInstructionId: promptInstructionId.startsWith('builtin-') ? '' : promptInstructionId,
      });

      if (!result.success) {
        toast.error(result.error || 'Không thể lưu bộ hướng dẫn.');
        return;
      }

      setItems((current) => current.map((item) => (
        item.id === promptItem.id
          ? { ...item, promptRule, promptBrief, promptContext, promptInstructionId }
          : item
      )));
    }

    const promptPack = composePromptPack(promptRule, promptBrief, promptContext);
    await navigator.clipboard.writeText(promptPack);
    toast.success('Đã lưu và sao chép bộ hướng dẫn.');
  };

  const copySection = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`Đã copy ${label}.`);
  };

  return (
    <div className="space-y-8">
      {initialLoadError && (
        <div className="border border-red-500/40 bg-red-500/[0.06] p-4 cyber-cut-sm">
          <p className="font-orbitron text-sm font-black uppercase text-red-600 dark:text-red-400">
            Supabase chưa sẵn sàng cho Content Schedule
          </p>
          <p className="body-sm mt-2 text-muted">
            Cần apply migration <code className="text-brand-orange">20260526_content_schedule_planner.sql</code> trước khi lưu lịch nội dung.
            Chi tiết lỗi: {initialLoadError}
          </p>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="border border-brand-orange/35 bg-cyber-black/5 p-5 cyber-cut-sm">
          <p className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest">Tổng kế hoạch</p>
          <p className="font-orbitron text-3xl font-black mt-3">{stats.total}</p>
        </div>
        <div className="border border-brand-orange/25 bg-brand-orange/[0.04] p-5 cyber-cut-sm">
          <p className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest">Bản nháp</p>
          <p className="font-orbitron text-3xl font-black mt-3">{stats.draft}</p>
        </div>
        <div className="border border-brand-orange/35 bg-brand-orange/[0.08] p-5 cyber-cut-sm">
          <p className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest">Đang thực hiện</p>
          <p className="font-orbitron text-3xl font-black mt-3">{stats.inProgress}</p>
        </div>
        <div className="border border-green-500/35 bg-green-500/[0.06] p-5 cyber-cut-sm">
          <p className="tech-mono text-green-700 dark:text-green-400 text-[10px] uppercase tracking-widest">Hoàn thành</p>
          <p className="font-orbitron text-3xl font-black mt-3">{stats.done}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-brand-orange/30 bg-cyber-black/5 p-6 cyber-cut">
          <div className="flex items-start justify-between gap-4 border-b border-brand-orange/25 pb-4 mb-5">
            <div>
              <h2 className="font-orbitron text-xl font-black">Nhập kế hoạch bài viết</h2>
              <p className="body-sm text-muted mt-2">
                Dán danh sách đánh số như ví dụ của bạn. Hệ thống sẽ nhận diện title, mô tả, mục tiêu và đối tượng.
              </p>
            </div>
            <ListPlus className="text-brand-orange shrink-0" size={24} />
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest font-bold">Ngày bắt đầu</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="border-2 border-brand-orange/40 bg-white dark:bg-cyber-gray p-3 tech-mono text-sm text-foreground outline-none focus:border-brand-orange"
              />
            </label>

            <textarea
              value={rawPlan}
              onChange={(event) => setRawPlan(event.target.value)}
              rows={12}
              placeholder="Dán kế hoạch bài viết tại đây..."
              className="min-h-[280px] border-2 border-brand-orange/35 bg-white dark:bg-cyber-gray p-4 tech-mono text-xs leading-6 text-foreground outline-none focus:border-brand-orange placeholder:text-muted/60"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadSamplePlan}
                className="inline-flex items-center gap-2 border border-brand-orange/45 bg-brand-orange/[0.06] px-5 py-3 font-orbitron text-xs font-black uppercase text-brand-orange transition-all hover:border-brand-orange hover:bg-brand-orange hover:text-white"
              >
                <FileText size={16} />
                Nạp mẫu 12 bài
              </button>
              <button
                type="button"
                onClick={importPlan}
                className="inline-flex items-center gap-2 bg-brand-orange px-5 py-3 font-orbitron text-xs font-black uppercase text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[4px_4px_0px_#0f172a]"
              >
                <ClipboardList size={16} />
                Thêm vào lịch
              </button>
              <button
                type="button"
                onClick={exportJson}
                disabled={items.length === 0}
                className="inline-flex items-center gap-2 border border-brand-orange/45 px-5 py-3 font-orbitron text-xs font-black uppercase text-brand-orange disabled:opacity-40"
              >
                <Download size={16} />
                Xuất JSON
              </button>
              <button
                type="button"
                onClick={clearBoard}
                disabled={items.length === 0}
                className="inline-flex items-center gap-2 border border-red-500/35 px-5 py-3 font-orbitron text-xs font-black uppercase text-red-600 disabled:opacity-40"
              >
                <RotateCcw size={16} />
                Xóa kế hoạch
              </button>
            </div>
          </div>
        </div>

        <div className="border border-brand-orange/30 bg-cyber-black/5 p-6 cyber-cut">
          <div className="flex items-start justify-between gap-4 border-b border-brand-orange/25 pb-4 mb-5">
            <div>
              <h2 className="font-orbitron text-xl font-black">Thêm nhanh bài viết</h2>
              <p className="body-sm text-muted mt-2">
                Dùng cho ý tưởng phát sinh chưa có đủ mô tả. Bài mới sẽ ở trạng thái bản nháp.
              </p>
            </div>
            <Plus className="text-brand-orange shrink-0" size={24} />
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={manualTitle}
              onChange={(event) => setManualTitle(event.target.value)}
              placeholder="Tên bài viết mới..."
              className="flex-1 border-2 border-brand-orange/35 bg-white dark:bg-cyber-gray p-3 tech-mono text-sm text-foreground outline-none focus:border-brand-orange placeholder:text-muted/60"
            />
            <button
              type="button"
              onClick={addManualItem}
              className="inline-flex items-center justify-center gap-2 bg-foreground px-5 py-3 font-orbitron text-xs font-black uppercase text-background"
            >
              <Plus size={16} />
              Thêm
            </button>
          </div>

          <div className="mt-6 border border-dashed border-brand-orange/30 bg-brand-orange/[0.04] p-5">
            <p className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest font-bold">Gợi ý dùng</p>
            <p className="body-sm text-muted mt-2">
              Sau khi parse, hãy chuyển 3-5 bài ưu tiên sang in_progress. Các bài đã viết/xuất bản có thể chuyển done
              để nhìn rõ tiến độ cluster nội dung.
            </p>
          </div>

          <div className="mt-6 border border-brand-orange/25 bg-white/65 dark:bg-cyber-black/35 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest font-bold">Thư viện hướng dẫn</p>
                <p className="body-sm text-muted mt-2">
                  Chọn instruction phù hợp để AI Agent viết bài. Có thể xem trước, thêm, sửa hoặc xóa instruction.
                </p>
              </div>
              <WandSparkles className="text-brand-orange shrink-0" size={20} />
            </div>

            <label className="mt-4 grid gap-2">
              <span className="tech-mono text-brand-orange text-[9px] uppercase tracking-widest">Hướng dẫn đang chọn</span>
              <select
                value={selectedInstructionId}
                onChange={(event) => setSelectedInstructionId(event.target.value)}
                className="border border-brand-orange/35 bg-white dark:bg-cyber-gray p-3 tech-mono text-xs text-foreground outline-none focus:border-brand-orange"
              >
                {instructions.map((instruction) => (
                  <option key={instruction.id} value={instruction.id}>
                    {instruction.name}{instruction.isDefault ? ' / default' : ''}
                  </option>
                ))}
              </select>
            </label>

            {selectedInstruction && (
              <div className="mt-3 border border-brand-orange/15 bg-brand-orange/[0.04] p-3">
                  <p className="body-sm text-muted line-clamp-2">{selectedInstruction.description || 'Chưa có mô tả hướng dẫn.'}</p>
                <p className="tech-mono mt-2 text-[9px] uppercase tracking-widest text-muted">
                  {selectedInstruction.content.length.toLocaleString('vi-VN')} ký tự
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openInstructionModal('preview')}
                className="inline-flex items-center gap-2 border border-brand-orange/35 px-3 py-2 tech-mono text-[10px] uppercase text-brand-orange"
              >
                <Eye size={14} />
                Xem trước
              </button>
              <button
                type="button"
                onClick={() => openInstructionModal('create')}
                className="inline-flex items-center gap-2 border border-brand-orange/35 px-3 py-2 tech-mono text-[10px] uppercase text-brand-orange"
              >
                <Plus size={14} />
                Thêm
              </button>
              <button
                type="button"
                onClick={() => openInstructionModal('edit')}
                className="inline-flex items-center gap-2 border border-brand-orange/35 px-3 py-2 tech-mono text-[10px] uppercase text-brand-orange"
              >
                <Edit3 size={14} />
                Sửa
              </button>
              <button
                type="button"
                onClick={removeInstruction}
                className="inline-flex items-center gap-2 border border-red-500/35 px-3 py-2 tech-mono text-[10px] uppercase text-red-600"
              >
                <Trash2 size={14} />
                Xóa
              </button>
            </div>
          </div>

          <div className="mt-6 border border-brand-orange/25 bg-white/65 dark:bg-cyber-black/35 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest font-bold">Nội dung tham chiếu</p>
                <p className="body-sm text-muted mt-2">
                  Dán nội dung bài pillar hoặc bài trước đó để AI Agent có tham chiếu khi viết bài cluster.
                </p>
              </div>
              <Edit3 className="text-brand-orange shrink-0" size={20} />
            </div>

            <div className="mt-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="tech-mono text-brand-orange text-[9px] uppercase tracking-widest">Chọn bài viết đã có</span>
                <span className="tech-mono text-[9px] uppercase tracking-widest text-muted">
                  {initialReferencePosts.length} bài viết
                </span>
              </div>

              {initialReferencePosts.length > 0 && (
                <div className="grid max-h-[360px] gap-3 overflow-y-auto border border-brand-orange/15 bg-white/40 p-3 dark:bg-cyber-black/20">
                  {initialReferencePosts.map((post) => {
                    const isSelected = post.id === selectedReferencePostId;

                    return (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => applyReferencePost(post.id)}
                        className={`group w-full border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-brand-orange bg-brand-orange/[0.1] shadow-[0_0_0_1px_rgba(255,107,26,0.18)]'
                            : 'border-brand-orange/20 bg-white/75 hover:border-brand-orange/50 hover:bg-brand-orange/[0.04] dark:bg-cyber-black/35'
                        }`}
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 border px-2 py-1 tech-mono text-[8px] uppercase tracking-widest ${
                            post.isPublished
                              ? 'border-green-500/25 text-green-700 dark:text-green-400'
                              : 'border-brand-orange/25 text-brand-orange'
                          }`}>
                            <FileText size={11} />
                            {post.isPublished ? 'Công khai' : 'Bản nháp'}
                          </span>
                          <span className="tech-mono text-[8px] uppercase tracking-widest text-muted">
                            {post.updatedAt ? formatDate(post.updatedAt) : 'Chưa có ngày'}
                          </span>
                          {isSelected && (
                            <span className="ml-auto tech-mono text-[8px] uppercase tracking-widest text-brand-orange">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <p className="font-orbitron text-sm font-black leading-snug text-foreground">
                          {post.title}
                        </p>
                        <p className="mt-2 body-sm text-muted line-clamp-2">
                          {post.excerpt || 'Bài viết này chưa có dẫn nhập/excerpt.'}
                        </p>
                        <p className="mt-3 border-t border-brand-orange/10 pt-2 tech-mono text-[9px] lowercase tracking-widest text-muted line-clamp-1">
                          /{post.slug}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedReferencePost && (
              <div className="mt-3 border border-brand-orange/15 bg-brand-orange/[0.04] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tech-mono text-[9px] uppercase tracking-widest text-muted">
                    Đang dùng làm tham chiếu
                  </span>
                  <span className={`tech-mono text-[9px] uppercase tracking-widest ${
                    selectedReferencePost.isPublished ? 'text-green-700 dark:text-green-400' : 'text-brand-orange'
                  }`}>
                    {selectedReferencePost.isPublished ? 'Công khai' : 'Bản nháp'}
                  </span>
                  <span className="tech-mono text-[9px] uppercase tracking-widest text-muted">
                    {selectedReferencePost.updatedAt ? formatDate(selectedReferencePost.updatedAt) : 'Chưa có ngày'}
                  </span>
                </div>
                <p className="mt-2 font-orbitron text-sm font-black text-foreground">{selectedReferencePost.title}</p>
                <p className="body-sm mt-2 text-muted line-clamp-3">
                  {selectedReferencePost.excerpt || 'Bài viết này chưa có dẫn nhập/excerpt.'}
                </p>
              </div>
            )}

            {initialReferencePosts.length === 0 && (
              <div className="mt-4 border border-dashed border-brand-orange/25 p-4">
                <p className="tech-mono text-[10px] uppercase tracking-widest text-muted">
                  Chưa có bài viết nào để chọn làm tham chiếu.
                </p>
              </div>
            )}

            <textarea
              value={previousArticleContent}
              onChange={(event) => setPreviousArticleContent(event.target.value)}
              rows={8}
              placeholder="Dán nội dung bài viết trước đó tại đây..."
              className="mt-4 min-h-[190px] w-full border border-brand-orange/30 bg-white dark:bg-cyber-gray p-4 tech-mono text-xs leading-6 text-foreground outline-none focus:border-brand-orange placeholder:text-muted/60"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {grouped.map(({ status, items: columnItems }) => {
          const meta = statusMeta[status];
          const Icon = meta.icon;

          return (
            <div key={status} className={`min-h-[420px] border p-4 cyber-cut ${meta.tone}`}>
              <div className="mb-4 flex items-center justify-between border-b border-brand-orange/20 pb-3">
                <div className="flex items-center gap-2">
                  <Icon size={18} className={status === 'done' ? 'text-green-600 dark:text-green-400' : 'text-brand-orange'} />
                  <h2 className="font-orbitron text-sm font-black uppercase tracking-widest">{meta.label}</h2>
                </div>
                <span className="tech-mono text-[10px] text-muted">{columnItems.length} bài</span>
              </div>

              <div className="grid gap-4">
                {columnItems.map((item) => (
                  <article key={item.id} className="border border-brand-orange/25 bg-white/80 dark:bg-cyber-black/50 p-4 cyber-cut-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="tech-mono text-brand-orange text-[9px] uppercase tracking-widest">
                          #{item.order.toString().padStart(2, '0')} / {formatDate(item.scheduledDate)}
                        </p>
                        <h3 className="font-orbitron text-base font-black text-foreground mt-2 leading-snug">
                          {item.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-muted hover:text-red-600 transition-colors"
                        title="Xóa khỏi lịch"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {item.description && (
                      <p className="body-sm text-muted mt-3 line-clamp-3">{item.description}</p>
                    )}

                    <div className="mt-4 grid gap-2 border-t border-brand-orange/15 pt-4">
                      <label className="grid gap-1">
                        <span className="tech-mono text-[9px] text-brand-orange uppercase tracking-widest">Lịch đăng</span>
                        <input
                          type="date"
                          value={item.scheduledDate}
                          onChange={(event) => updateDate(item.id, event.target.value)}
                          className="border border-brand-orange/30 bg-transparent px-3 py-2 tech-mono text-xs outline-none focus:border-brand-orange"
                        />
                      </label>

                      <div className="flex flex-wrap gap-2">
                        {(['draft', 'in_progress', 'done'] as ContentScheduleStatus[]).map((nextStatus) => (
                          <button
                            key={nextStatus}
                            type="button"
                            onClick={() => updateStatus(item.id, nextStatus)}
                            className={`border px-3 py-1.5 tech-mono text-[9px] uppercase transition-all ${
                              item.status === nextStatus
                                ? 'border-brand-orange bg-brand-orange text-white'
                                : 'border-brand-orange/25 text-muted hover:text-brand-orange'
                            }`}
                          >
                            {statusMeta[nextStatus].label}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => openPromptBuilder(item)}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 border border-brand-orange/45 bg-brand-orange/[0.08] px-4 py-2.5 font-orbitron text-[10px] font-black uppercase tracking-widest text-brand-orange transition-all hover:border-brand-orange hover:bg-brand-orange hover:text-white"
                      >
                        <WandSparkles size={15} />
                        Tạo Prompt AI
                      </button>
                    </div>

                    {(item.goal || item.audience || item.previousContext) && (
                      <details className="mt-4 border-t border-brand-orange/10 pt-3">
                        <summary className="cursor-pointer tech-mono text-[10px] text-brand-orange uppercase tracking-widest">
                          Chi tiết kế hoạch
                        </summary>
                        <div className="mt-3 space-y-2 text-sm text-muted">
                          {item.previousContext && <p><strong className="text-foreground">Bài trước:</strong> {item.previousContext}</p>}
                          {item.goal && <p><strong className="text-foreground">Mục tiêu:</strong> {item.goal}</p>}
                          {item.audience && <p><strong className="text-foreground">Đối tượng:</strong> {item.audience}</p>}
                          <p><strong className="text-foreground">Slug:</strong> {item.slug}</p>
                        </div>
                      </details>
                    )}
                  </article>
                ))}

                {columnItems.length === 0 && (
                  <div className="border border-dashed border-brand-orange/25 p-8 text-center">
                    <FileText className="mx-auto text-brand-orange/60" size={26} />
                    <p className="tech-mono text-muted text-[10px] uppercase tracking-widest mt-3">Chưa có post</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {promptItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-black/75 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col border border-brand-orange/55 bg-background shadow-[0_30px_90px_rgba(0,0,0,0.45)] cyber-cut">
            <div className="flex flex-col gap-4 border-b border-brand-orange/25 p-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="tech-mono text-brand-orange text-[10px] uppercase tracking-[0.28em] font-bold">AI Agent Prompt Pack</p>
                <h2 className="mt-2 font-orbitron text-2xl font-black uppercase leading-tight text-foreground">
                  {promptItem.title}
                </h2>
                <p className="body-sm mt-2 text-muted">
                  Kiểm tra và chỉnh 3 cụm dữ liệu trước khi copy cho AI Agent viết bài chi tiết.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyPromptPack}
                  className="inline-flex items-center gap-2 bg-brand-orange px-4 py-3 font-orbitron text-xs font-black uppercase text-white shadow-[4px_4px_0px_#0f172a]"
                >
                  <Copy size={16} />
                  Copy toàn bộ
                </button>
                <button
                  type="button"
                  onClick={() => setPromptItem(null)}
                  className="inline-flex items-center gap-2 border border-foreground/20 px-4 py-3 font-orbitron text-xs font-black uppercase text-foreground"
                  aria-label="Đóng Prompt Pack"
                >
                  <X size={16} />
                  Đóng
                </button>
              </div>
            </div>

            <div className="grid flex-1 gap-4 overflow-y-auto p-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="grid gap-4">
                <section className="border border-brand-orange/25 bg-brand-orange/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest font-bold">Cụm 1 / Rule</p>
                      <p className="body-sm text-muted">
                        Instruction bắt buộc cho editor, SEO và GEO/AIO.
                        {promptInstruction ? ` Đang dùng: ${promptInstruction.name}.` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copySection('Rule', promptRule)}
                      className="inline-flex items-center gap-2 border border-brand-orange/35 px-3 py-2 tech-mono text-[10px] uppercase text-brand-orange"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                  <label className="mb-3 grid gap-2">
                    <span className="tech-mono text-brand-orange text-[9px] uppercase tracking-widest">Đổi instruction cho prompt này</span>
                    <select
                      value={promptInstructionId}
                      onChange={(event) => {
                        const nextInstruction = instructions.find((instruction) => instruction.id === event.target.value);
                        setPromptInstructionId(event.target.value);
                        if (nextInstruction) setPromptRule(nextInstruction.content);
                      }}
                      className="border border-brand-orange/35 bg-white dark:bg-cyber-gray p-3 tech-mono text-xs text-foreground outline-none focus:border-brand-orange"
                    >
                      {instructions.map((instruction) => (
                        <option key={instruction.id} value={instruction.id}>
                          {instruction.name}{instruction.isDefault ? ' / default' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <textarea
                    value={promptRule}
                    onChange={(event) => setPromptRule(event.target.value)}
                    rows={16}
                    className="h-[360px] w-full border border-brand-orange/25 bg-white dark:bg-cyber-gray p-4 tech-mono text-xs leading-6 text-foreground outline-none focus:border-brand-orange"
                  />
                </section>
              </div>

              <div className="grid gap-4">
                <section className="border border-brand-orange/25 bg-white/70 dark:bg-cyber-black/35 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest font-bold">Cụm 2 / Post Brief</p>
                      <p className="body-sm text-muted">Thông tin bài hiện tại lấy từ kế hoạch đã import.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copySection('Post Brief', promptBrief)}
                      className="inline-flex items-center gap-2 border border-brand-orange/35 px-3 py-2 tech-mono text-[10px] uppercase text-brand-orange"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                  <textarea
                    value={promptBrief}
                    onChange={(event) => setPromptBrief(event.target.value)}
                    rows={12}
                    className="h-[280px] w-full border border-brand-orange/25 bg-white dark:bg-cyber-gray p-4 tech-mono text-xs leading-6 text-foreground outline-none focus:border-brand-orange"
                  />
                </section>

                <section className="border border-brand-orange/25 bg-white/70 dark:bg-cyber-black/35 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest font-bold">Cụm 3 / Context bài trước</p>
                      <p className="body-sm text-muted">Nội dung tham chiếu để AI giữ mạch cluster.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copySection('Context bài trước', promptContext)}
                      className="inline-flex items-center gap-2 border border-brand-orange/35 px-3 py-2 tech-mono text-[10px] uppercase text-brand-orange"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                  <textarea
                    value={promptContext}
                    onChange={(event) => setPromptContext(event.target.value)}
                    rows={10}
                    placeholder="Dán hoặc chỉnh nội dung bài viết trước đó..."
                    className="h-[230px] w-full border border-brand-orange/25 bg-white dark:bg-cyber-gray p-4 tech-mono text-xs leading-6 text-foreground outline-none focus:border-brand-orange placeholder:text-muted/60"
                  />
                </section>
              </div>
            </div>

            <div className="border-t border-brand-orange/25 bg-brand-orange/[0.04] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="body-sm text-muted">
                  Prompt cuối sẽ ghép đúng thứ tự: Rule, Post Brief, Context bài trước, rồi thêm nhiệm vụ cuối cho AI Agent.
                </p>
                <button
                  type="button"
                  onClick={copyPromptPack}
                  className="inline-flex items-center justify-center gap-2 bg-foreground px-5 py-3 font-orbitron text-xs font-black uppercase text-background"
                >
                  <Copy size={16} />
                  Copy Prompt Pack
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {instructionModalMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-cyber-black/75 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col border border-brand-orange/55 bg-background shadow-[0_30px_90px_rgba(0,0,0,0.45)] cyber-cut">
            <div className="flex flex-col gap-4 border-b border-brand-orange/25 p-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="tech-mono text-brand-orange text-[10px] uppercase tracking-[0.28em] font-bold">
                  AI Agent Instruction
                </p>
                <h2 className="mt-2 font-orbitron text-2xl font-black uppercase leading-tight text-foreground">
                  {instructionModalMode === 'create' && 'Tạo instruction mới'}
                  {instructionModalMode === 'edit' && 'Chỉnh sửa instruction'}
                  {instructionModalMode === 'preview' && 'Xem trước instruction'}
                </h2>
                <p className="body-sm mt-2 text-muted">
                  Instruction sẽ được lưu vào Supabase và dùng làm Rule cho Prompt Pack khi tạo bài viết.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInstructionModalMode(null)}
                className="inline-flex items-center gap-2 border border-foreground/20 px-4 py-3 font-orbitron text-xs font-black uppercase text-foreground"
                aria-label="Đóng Instruction"
              >
                <X size={16} />
                Đóng
              </button>
            </div>

            <div className="grid flex-1 gap-4 overflow-y-auto p-5 lg:grid-cols-[0.42fr_0.58fr]">
              <div className="grid content-start gap-4">
                <label className="grid gap-2">
                  <span className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest font-bold">Tên instruction</span>
                  <input
                    value={instructionDraft.name}
                    onChange={(event) => setInstructionDraft((current) => ({ ...current, name: event.target.value }))}
                    disabled={instructionModalMode === 'preview'}
                    placeholder="VD: Production Safe Editorial System v5"
                    className="border-2 border-brand-orange/35 bg-white dark:bg-cyber-gray p-3 tech-mono text-sm text-foreground outline-none focus:border-brand-orange disabled:opacity-70"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest font-bold">Mô tả</span>
                  <textarea
                    value={instructionDraft.description}
                    onChange={(event) => setInstructionDraft((current) => ({ ...current, description: event.target.value }))}
                    disabled={instructionModalMode === 'preview'}
                    rows={5}
                    placeholder="Mô tả instruction này dùng cho trường hợp nào..."
                    className="border-2 border-brand-orange/35 bg-white dark:bg-cyber-gray p-3 tech-mono text-xs leading-6 text-foreground outline-none focus:border-brand-orange disabled:opacity-70"
                  />
                </label>

                <label className="flex items-center gap-3 border border-brand-orange/25 bg-brand-orange/[0.04] p-3">
                  <input
                    type="checkbox"
                    checked={instructionDraft.isDefault}
                    onChange={(event) => setInstructionDraft((current) => ({ ...current, isDefault: event.target.checked }))}
                    disabled={instructionModalMode === 'preview'}
                    className="h-4 w-4 accent-brand-orange"
                  />
                  <span className="tech-mono text-[10px] uppercase tracking-widest text-foreground">
                    Đặt làm instruction mặc định
                  </span>
                </label>

                <div className="border border-brand-orange/20 bg-white/70 dark:bg-cyber-black/35 p-4">
                  <p className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest">Thông tin</p>
                  <p className="body-sm mt-2 text-muted">
                    Nội dung hiện tại có {instructionDraft.content.length.toLocaleString('vi-VN')} ký tự.
                    Khi lưu, instruction này sẽ xuất hiện trong dropdown chọn Rule.
                  </p>
                </div>
              </div>

              <label className="grid gap-2">
                <span className="tech-mono text-brand-orange text-[10px] uppercase tracking-widest font-bold">Nội dung instruction</span>
                <textarea
                  value={instructionDraft.content}
                  onChange={(event) => setInstructionDraft((current) => ({ ...current, content: event.target.value }))}
                  disabled={instructionModalMode === 'preview'}
                  rows={22}
                  placeholder="Dán instruction mới tại đây..."
                  className="min-h-[560px] border-2 border-brand-orange/35 bg-white dark:bg-cyber-gray p-4 tech-mono text-xs leading-6 text-foreground outline-none focus:border-brand-orange disabled:opacity-80"
                />
              </label>
            </div>

            <div className="border-t border-brand-orange/25 bg-brand-orange/[0.04] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="body-sm text-muted">
                  Có thể xem trước toàn bộ instruction trước khi chọn làm Rule cho bài viết.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copySection('Instruction', instructionDraft.content)}
                    className="inline-flex items-center justify-center gap-2 border border-brand-orange/35 px-5 py-3 font-orbitron text-xs font-black uppercase text-brand-orange"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                  {instructionModalMode !== 'preview' && (
                    <button
                      type="button"
                      onClick={saveInstruction}
                      className="inline-flex items-center justify-center gap-2 bg-foreground px-5 py-3 font-orbitron text-xs font-black uppercase text-background"
                    >
                      <Edit3 size={16} />
                      Lưu instruction
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
