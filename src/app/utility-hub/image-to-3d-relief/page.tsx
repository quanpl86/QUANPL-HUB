import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ImageTo3DRelief from '@/components/utility/ImageTo3DRelief';

export const metadata: Metadata = {
  title: 'Tạo tranh 3D mặt nổi từ ảnh 2D | KING DRAGON HUB',
  description: 'Công cụ chuyển đổi ảnh màu, logo, hoặc hình minh họa phẳng thành mô hình 3D (STL) để in 3D.',
};

export default function ImageTo3DPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b border-foreground/10 bg-foreground/[0.02]">
        <div className="container mx-auto px-6 py-8">
          <Link
            href="/utility-hub"
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 transition-colors hover:text-brand-orange"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Quay lại Utility Hub
          </Link>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/5 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">EXPERIMENTAL TOOL</span>
              </div>
              <h1 className="font-[family-name:var(--font-inter)] text-4xl font-black tracking-tight md:text-5xl">
                Tạo tranh 3D mặt nổi
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/70">
                Chuyển đổi hình ảnh (logo, vector phẳng, nét vẽ) thành mô hình 3D dập nổi dạng `.STL` để mang đi in 3D. 
                Mọi quá trình xử lý đều diễn ra an toàn trên trình duyệt của bạn.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-10 max-w-7xl">
        <ImageTo3DRelief />
      </main>
    </div>
  );
}
