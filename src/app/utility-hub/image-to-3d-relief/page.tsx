import { Metadata } from 'next';
import ImageTo3DRelief from '@/components/utility/ImageTo3DRelief';

export const metadata: Metadata = {
  title: 'Tạo tranh 3D mặt nổi từ ảnh 2D | KING DRAGON HUB',
  description: 'Công cụ chuyển đổi ảnh màu, logo, hoặc hình minh họa phẳng thành mô hình 3D (STL) để in 3D.',
};

export default function ImageTo3DPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/5 border border-brand-orange/20 mb-4">
            <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">EXPERIMENTAL TOOL</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-inter)] text-foreground mb-4">
            Tạo tranh 3D mặt nổi
          </h1>
          <p className="text-foreground/70 max-w-2xl mx-auto md:mx-0 leading-relaxed text-lg">
            Chuyển đổi hình ảnh (logo, vector phẳng, nét vẽ) thành mô hình 3D dập nổi dạng `.STL` để mang đi in 3D. 
            Mọi quá trình xử lý đều diễn ra an toàn trên trình duyệt của bạn.
          </p>
        </div>

        <ImageTo3DRelief />
      </div>
    </div>
  );
}
