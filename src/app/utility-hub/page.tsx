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
    title: 'Chuyển ảnh sang vector',
    description: 'Biến logo, icon hoặc hình minh họa raster thành SVG/vector để dùng trong bài giảng, thiết kế và STEM kit.',
    icon: Wand2,
    status: 'ĐANG THIẾT KẾ',
    formats: 'TỪ PNG/JPG SANG SVG',
  },
  {
    title: 'Chuyển định dạng ảnh',
    description: 'Đổi nhanh giữa PNG, JPG, WebP và AVIF, ưu tiên chất lượng ổn định và file nhẹ cho website.',
    icon: RefreshCw,
    status: 'ĐÃ LÊN KẾ HOẠCH',
    formats: 'ĐA ĐỊNH DẠNG ẢNH',
  },
  {
    title: 'Tách nền ảnh',
    description: 'Tạo ảnh nền trong suốt cho nhân vật, sản phẩm, mô hình robot hoặc tư liệu lớp học.',
    icon: Scissors,
    status: 'ĐÃ LÊN KẾ HOẠCH',
    formats: 'ẢNH -> NỀN TRONG SUỐT',
  },
  {
    title: 'Nén và tối ưu ảnh',
    description: 'Giảm dung lượng ảnh trước khi đăng bài mà vẫn giữ độ sắc nét cần thiết cho hình minh họa kỹ thuật.',
    icon: Gauge,
    status: 'TRONG HÀNG ĐỢI',
    formats: 'NÉN GIỮ NGUYÊN CHẤT LƯỢNG',
  },
  {
    title: 'Tạo bảng màu từ ảnh',
    description: 'Trích xuất palette từ mascot, poster, robot field hoặc ảnh sản phẩm để giữ visual system nhất quán.',
    icon: Palette,
    status: 'TRONG HÀNG ĐỢI',
    formats: 'ẢNH -> BẢNG MÀU',
  },
  {
    title: 'Đóng gói asset',
    description: 'Chuẩn hóa tên file, kích thước và định dạng để đưa asset vào bài viết, slide hoặc thư viện học liệu.',
    icon: Archive,
    status: 'LỘ TRÌNH',
    formats: 'ĐÓNG GÓI TÀI NGUYÊN BATCH',
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
      <section className="relative overflow-hidden border-b border-brand-orange/25 bg-cyber-gray dragon-grid py-20">
        <div className="absolute -right-28 top-12 h-80 w-80 rounded-full bg-brand-orange/15 blur-[90px]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 border border-brand-orange/45 bg-brand-orange/10 px-4 py-2 text-brand-orange tech-mono mb-6">
              <span className="h-2 w-2 bg-brand-orange animate-pulse" />
              LỘ TRÌNH TIỆN ÍCH
            </div>
            <h1 className="cyber-h1">
              Xưởng <span className="cyber-text-gradient">tiện ích sáng tạo</span>
            </h1>
            <p className="body-lg text-muted mt-6 max-w-3xl">
              Utility Hub sẽ là nơi tập hợp các công cụ xử lý ảnh, asset, học liệu và workflow nhỏ phục vụ STEM,
              Robotics, AI content và hệ thống Second Brain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {roadmap.map((item) => (
                <span
                  key={item}
                  className="border border-brand-orange/35 bg-cyber-black/40 px-4 py-2 tech-mono text-foreground/80"
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
          <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="cyber-h2">Tool đầu tiên sẽ triển khai</h2>
              <p className="body-base text-muted mt-3 max-w-3xl">
                Các thẻ dưới đây là kiến trúc sản phẩm dự kiến. Khi từng công cụ sẵn sàng, mỗi module sẽ mở thành một
                workspace có upload, preview, tuỳ chọn xử lý và xuất file.
              </p>
            </div>
            <Link
              href="/blog?q=utility"
              className="inline-flex items-center justify-center gap-2 border border-brand-orange/50 px-5 py-3 font-orbitron text-sm font-bold uppercase text-brand-orange transition-all hover:bg-brand-orange/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background cyber-cut-sm"
            >
              Ghi chú phát triển
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredTools.map((tool) => {
              const Icon = tool.icon;

              return (
                <article
                  key={tool.title}
                  className="relative flex min-h-[290px] flex-col overflow-hidden border border-brand-orange/25 bg-cyber-black/50 p-6 cyber-cut"
                >
                  <div className="absolute right-0 top-0 h-20 min-w-[5rem] px-6 flex items-center justify-center border-b border-l border-brand-orange/25 bg-brand-orange/[0.07]">
                    <span className="tech-mono text-brand-orange/85 !text-[9px] pt-3">{tool.status}</span>
                  </div>
                  <div className="mb-7 flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center border border-brand-orange/50 bg-brand-orange/10 text-brand-orange cyber-cut-sm">
                      <Icon size={24} aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className="font-orbitron text-xl font-bold text-foreground">{tool.title}</h3>
                  <p className="body-base text-muted mt-4">{tool.description}</p>
                  <div className="mt-auto pt-8 border-t border-brand-orange/25">
                    <p className="tech-mono text-brand-orange/85 !text-[9px] mb-3">{tool.formats}</p>
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed items-center justify-center gap-2 border border-brand-orange/35 px-4 py-2 font-orbitron text-xs font-bold uppercase text-foreground/75 cyber-cut-sm"
                    >
                      Đang thiết kế
                      <FlaskConical size={14} aria-hidden="true" />
                    </button>
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
            <div className="border border-brand-orange/25 bg-brand-orange/[0.07] p-6 cyber-cut">
              <div className="flex h-14 w-14 items-center justify-center border border-brand-orange/50 bg-brand-orange/10 text-brand-orange cyber-cut-sm mb-6">
                <Sparkles size={26} aria-hidden="true" />
              </div>
              <h2 className="font-orbitron text-2xl font-bold text-foreground">Nguyên tắc thiết kế tool</h2>
              <div className="mt-6 space-y-4">
                {toolPrinciples.map((principle) => (
                  <div key={principle} className="flex gap-3 text-muted">
                    <span className="mt-2 h-2 w-2 bg-brand-orange" />
                    <p className="body-base">{principle}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-brand-orange/25 bg-cyber-black/40 p-6 cyber-cut">
              <div className="flex h-14 w-14 items-center justify-center border border-brand-orange/50 bg-brand-orange/10 text-brand-orange cyber-cut-sm mb-6">
                <ImageUp size={26} aria-hidden="true" />
              </div>
              <h2 className="font-orbitron text-2xl font-bold text-foreground">Module ưu tiên: Image Toolkit</h2>
              <p className="body-base text-muted mt-4">
                Nhóm công cụ ảnh nên đi trước vì phục vụ trực tiếp cho bài viết, slide, học liệu, mascot, robotics field
                và asset STEM. Khi triển khai code, nên bắt đầu bằng chuyển định dạng ảnh vì ít phụ thuộc AI nhất, sau đó
                đến tách nền và vector hóa.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 border border-brand-orange/45 px-4 py-2 tech-mono text-brand-orange">
                  <FileImage size={14} aria-hidden="true" />
                  AN TOÀN DỮ LIỆU ĐẦU VÀO
                </span>
                <span className="inline-flex items-center gap-2 border border-brand-orange/45 px-4 py-2 tech-mono text-brand-orange">
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
