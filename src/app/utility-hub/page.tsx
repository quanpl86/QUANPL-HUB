import Link from 'next/link';
import {
  Archive,
  ArrowRight,
  FileImage,
  FlaskConical,
  Gauge,
  ImageUp,
  Palette,
  RefreshCw,
  Scissors,
  Sparkles,
  Wand2,
} from 'lucide-react';

const featuredTools = [
  {
    title: 'Tạo tranh 3D mặt nổi',
    description: 'Biến logo, ảnh màu solid thành mặt nổi 3D (Relief) để xuất file STL in 3D.',
    icon: Wand2,
    status: 'SẴN SÀNG',
    formats: 'TỪ PNG/JPG SANG STL',
    href: '/utility-hub/image-to-3d-relief',
    color: 'from-orange-500/20 to-orange-500/5'
  },
  {
    title: 'Chuyển định dạng ảnh',
    description: 'Đổi nhanh giữa PNG, JPG, WebP và AVIF, ưu tiên chất lượng ổn định và file nhẹ cho website.',
    icon: RefreshCw,
    status: 'ĐÃ LÊN KẾ HOẠCH',
    formats: 'ĐA ĐỊNH DẠNG ẢNH',
    color: 'from-blue-500/20 to-blue-500/5'
  },
  {
    title: 'Tách nền ảnh',
    description: 'Tạo ảnh nền trong suốt cho nhân vật, sản phẩm, mô hình robot hoặc tư liệu lớp học.',
    icon: Scissors,
    status: 'SẴN SÀNG',
    formats: 'ẢNH -> NỀN TRONG SUỐT',
    href: '/utility-hub/background-remover',
    color: 'from-emerald-500/20 to-emerald-500/5'
  },
  {
    title: 'Nén và tối ưu ảnh',
    description: 'Giảm dung lượng ảnh trước khi đăng bài mà vẫn giữ độ sắc nét cần thiết cho hình minh họa kỹ thuật.',
    icon: Gauge,
    status: 'TRONG HÀNG ĐỢI',
    formats: 'NÉN GIỮ NGUYÊN CHẤT LƯỢNG',
    color: 'from-purple-500/20 to-purple-500/5'
  },
  {
    title: 'Tạo bảng màu từ ảnh',
    description: 'Trích xuất palette từ mascot, poster, robot field hoặc ảnh sản phẩm để giữ visual system nhất quán.',
    icon: Palette,
    status: 'TRONG HÀNG ĐỢI',
    formats: 'ẢNH -> BẢNG MÀU',
    color: 'from-pink-500/20 to-pink-500/5'
  },
  {
    title: 'Đóng gói asset',
    description: 'Chuẩn hóa tên file, kích thước và định dạng để đưa asset vào bài viết, slide hoặc thư viện học liệu.',
    icon: Archive,
    status: 'LỘ TRÌNH',
    formats: 'ĐÓNG GÓI TÀI NGUYÊN BATCH',
    color: 'from-cyan-500/20 to-cyan-500/5'
  },
];

const toolPrinciples = [
  'Chạy nhanh trên trình duyệt khi có thể',
  'Không làm mất file gốc',
  'Ưu tiên định dạng dùng được cho giáo dục và web',
  'Có preview trước khi tải kết quả',
];

const roadmap = [
  'Bộ công cụ xử lý ảnh',
  'Tiện ích tài liệu',
  'Công cụ worksheet STEM',
  'Tiện ích sa bàn Robotics',
  'Tiện ích Prompt AI',
];

export default function UtilityHubPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden bg-background py-20">
        <div className="absolute -right-28 top-12 h-80 w-80 rounded-full bg-brand-orange/10 blur-[100px]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/5 border border-brand-orange/20 mb-6">
              <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">LỘ TRÌNH TIỆN ÍCH</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-inter)] tracking-tight text-foreground">
              Xưởng <span className="text-brand-orange">tiện ích sáng tạo</span>
            </h1>
            <p className="text-lg text-foreground/70 mt-6 max-w-3xl leading-relaxed">
              Utility Hub sẽ là nơi tập hợp các công cụ xử lý ảnh, asset, học liệu và workflow nhỏ phục vụ STEM,
              Robotics, AI content và hệ thống Second Brain.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {roadmap.map((item) => (
                <span
                  key={item}
                  className="px-4 py-2 rounded-lg bg-foreground/[0.03] border border-foreground/10 text-sm font-medium text-foreground/80"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-8">
            <div>
              <h2 className="text-2xl font-bold font-[family-name:var(--font-inter)] text-foreground">Tool đầu tiên sẽ triển khai</h2>
              <p className="text-sm text-foreground/70 mt-3 max-w-3xl leading-relaxed">
                Các thẻ dưới đây là kiến trúc sản phẩm dự kiến. Khi từng công cụ sẵn sàng, mỗi module sẽ mở thành một
                workspace có upload, preview, tuỳ chọn xử lý và xuất file.
              </p>
            </div>
            <Link
              href="/blog?q=utility"
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-brand-orange text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-brand-orange/90 transition-all focus:outline-none hover:shadow-lg hover:shadow-brand-orange/20"
            >
              Ghi chú phát triển
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredTools.map((tool) => {
              const Icon = tool.icon;

              return (
                <article
                  key={tool.title}
                  className="group relative flex min-h-[320px] flex-col overflow-hidden p-8 rounded-2xl border border-foreground/10 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                >
                  {/* Gradient overlay */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${tool.color} blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  <div className="mb-6 flex items-start justify-between gap-4 relative z-10">
                    <div className="inline-flex p-4 rounded-xl bg-background border border-foreground/10 shadow-sm text-foreground/80 group-hover:text-brand-orange transition-colors">
                      <Icon size={28} aria-hidden="true" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 bg-foreground/5 px-2 py-1 rounded-md">
                      {tool.status}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold font-[family-name:var(--font-inter)] text-foreground mb-3 relative z-10 leading-snug">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-foreground/70 mb-8 leading-relaxed relative z-10">
                    {tool.description}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-foreground/10 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 bg-foreground/5 px-2 py-1 rounded-md inline-flex w-fit">
                      {tool.formats}
                    </p>
                    {tool.href ? (
                      <Link
                        href={tool.href}
                        className="inline-flex items-center justify-center gap-2 bg-brand-orange text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-brand-orange/90 transition-all shadow-md shadow-brand-orange/20"
                      >
                        Mở công cụ
                        <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex cursor-not-allowed items-center justify-center gap-2 bg-foreground/5 border border-foreground/10 text-foreground/50 px-5 py-2.5 rounded-full text-xs font-bold"
                      >
                        Đang thiết kế
                        <FlaskConical size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            
            <div className="p-8 rounded-2xl border border-brand-orange/20 bg-brand-orange/5">
              <div className="inline-flex p-4 rounded-xl bg-background border border-brand-orange/20 shadow-sm text-brand-orange mb-6">
                <Sparkles size={26} aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold font-[family-name:var(--font-inter)] text-foreground mb-6">Nguyên tắc thiết kế tool</h2>
              <div className="space-y-4">
                {toolPrinciples.map((principle) => (
                  <div key={principle} className="flex gap-3 text-foreground/80">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-brand-orange" />
                    </div>
                    <p className="text-sm leading-relaxed">{principle}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-foreground/10 bg-foreground/[0.02]">
              <div className="inline-flex p-4 rounded-xl bg-background border border-foreground/10 shadow-sm text-foreground/70 mb-6">
                <ImageUp size={26} aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold font-[family-name:var(--font-inter)] text-foreground mb-4">Module ưu tiên: Image Toolkit</h2>
              <p className="text-sm text-foreground/70 leading-relaxed max-w-2xl">
                Nhóm công cụ ảnh nên đi trước vì phục vụ trực tiếp cho bài viết, slide, học liệu, mascot, robotics field
                và asset STEM. Khi triển khai code, nên bắt đầu bằng chuyển định dạng ảnh vì ít phụ thuộc AI nhất, sau đó
                đến tách nền và vector hóa.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground/5 border border-foreground/10 text-xs font-bold uppercase tracking-wider text-foreground/60">
                  <FileImage size={14} aria-hidden="true" />
                  AN TOÀN DỮ LIỆU ĐẦU VÀO
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground/5 border border-foreground/10 text-xs font-bold uppercase tracking-wider text-foreground/60">
                  <Sparkles size={14} aria-hidden="true" />
                  XEM TRƯỚC KẾT QUẢ
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
