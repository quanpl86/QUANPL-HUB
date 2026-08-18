-- Link categories to subjects and seed a diverse KingDragonHub catalog.
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS subject_id BIGINT REFERENCES subjects(id) ON DELETE SET NULL;

-- Fields (lĩnh vực)
INSERT INTO fields (name, slug, description) VALUES
  ('Engineering & Technology', 'eng-tech', 'Kỹ thuật, công nghệ, lập trình và hệ thống.'),
  ('Education & Skills', 'edu-skills', 'Phương pháp giảng dạy, phát triển giáo viên và kỹ năng học tập.'),
  ('Sciences', 'sciences', 'Khoa học cơ bản, khoa học máy tính và tư duy khoa học.'),
  ('Arts & Creative', 'arts-creative', 'Thiết kế, đa phương tiện và sáng tạo số.')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Subjects (chủ đề)
INSERT INTO subjects (name, slug, description, field_id)
SELECT v.name, v.slug, v.description, f.id
FROM (VALUES
  ('STEM', 'stem', 'STEM tổng hợp: khoa học, công nghệ, kỹ thuật, toán.', 'eng-tech'),
  ('AI', 'ai', 'Trí tuệ nhân tạo và AI tạo sinh.', 'eng-tech'),
  ('ROBOTICS', 'robotics', 'Robot, cảm biến và phần cứng.', 'eng-tech'),
  ('SOFTWARE', 'software', 'Lập trình web, ứng dụng và công cụ số.', 'eng-tech'),
  ('PEDAGOGY', 'pedagogy', 'Phương pháp dạy học, PBL, 5E, rubric.', 'edu-skills'),
  ('EARLY CHILDHOOD', 'early-childhood', 'Giáo dục mầm non và độ tuổi nhỏ.', 'edu-skills'),
  ('ASSESSMENT', 'assessment', 'Đánh giá, học liệu và chương trình.', 'edu-skills'),
  ('COMPUTER SCIENCE', 'computer-science', 'Tin học, tư duy thuật toán và coding giáo dục.', 'sciences'),
  ('3D DESIGN', '3d-design', 'Thiết kế 3D và in 3D.', 'arts-creative'),
  ('MULTIMEDIA', 'multimedia', 'Nội dung số, hình ảnh, video cho lớp học.', 'arts-creative')
) AS v(name, slug, description, field_slug)
JOIN fields f ON f.slug = v.field_slug
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, field_id = EXCLUDED.field_id;

-- Categories (danh mục) gắn chủ đề
INSERT INTO categories (name, slug, description, subject_id)
SELECT v.name, v.slug, v.description, s.id
FROM (VALUES
  ('STEM Education', 'stem-education', 'Kiến thức và thực hành STEM trong nhà trường.', 'stem'),
  ('Project-Based Learning', 'project-based-learning', 'PBL, sản phẩm học tập và dự án lớp học.', 'pedagogy'),
  ('Instructional Models', 'instructional-models', '5E, inquiry, Bloom, NGSS và mô hình giảng dạy.', 'pedagogy'),
  ('Early Childhood Education', 'early-childhood-education', 'Giáo dục mầm non, chơi mà học, học liệu tuổi nhỏ.', 'early-childhood'),
  ('Teacher Development', 'teacher-development', 'Bồi dưỡng giáo viên, workflow soạn giảng, kiểm chứng AI.', 'pedagogy'),
  ('Artificial Intelligence', 'artificial-intelligence', 'Nền tảng AI, machine learning và khái niệm cốt lõi.', 'ai'),
  ('AI in Education', 'ai-in-education', 'AI hỗ trợ dạy học, học liệu và cá nhân hóa.', 'ai'),
  ('Generative AI Tools', 'generative-ai-tools', 'ChatGPT, tạo sinh nội dung, prompt và an toàn dữ liệu.', 'ai'),
  ('Robotics & Hardware', 'robotics-hardware', 'Robot lớp học, mạch điện, cảm biến.', 'robotics'),
  ('Competition Robotics', 'competition-robotics', 'WRO, FTC và robot thi đấu.', 'robotics'),
  ('Full-stack Development', 'fullstack-development', 'Lập trình web và ứng dụng.', 'software'),
  ('Scratch & Block Coding', 'scratch-block-coding', 'Scratch, Blockly và lập trình khối.', 'computer-science'),
  ('Python for Education', 'python-for-education', 'Python trong dạy học và chấm bài.', 'computer-science'),
  ('Computer Science Education', 'computer-science-education', 'Tin học phổ thông, thuật toán, CSTA.', 'computer-science'),
  ('Learning Assessment', 'learning-assessment', 'Rubric, đánh giá năng lực và bằng chứng học tập.', 'assessment'),
  ('3D Design & Printing', '3d-design-printing', 'Thiết kế 3D, in 3D, mô phỏng.', '3d-design'),
  ('Multimedia for Learning', 'multimedia-for-learning', 'Ảnh, video, infographic phục vụ bài giảng.', 'multimedia')
) AS v(name, slug, description, subject_slug)
JOIN subjects s ON s.slug = v.subject_slug
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, subject_id = EXCLUDED.subject_id;

CREATE INDEX IF NOT EXISTS categories_subject_id_idx ON categories (subject_id);
CREATE INDEX IF NOT EXISTS subjects_field_id_idx ON subjects (field_id);
