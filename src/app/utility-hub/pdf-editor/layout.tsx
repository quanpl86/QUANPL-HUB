import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Editor',
  description:
    'Nhập PDF, chỉnh văn bản và hình ảnh bằng trình soạn thảo bài viết của King Dragon Hub, rồi xuất lại file PDF.',
};

export default function PdfEditorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
