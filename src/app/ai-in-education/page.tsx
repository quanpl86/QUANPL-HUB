import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowRight, 
  Sparkles, 
  Compass, 
  Brain, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  Layers, 
  Lightbulb, 
  Workflow,
  Wrench,
  ChevronRight
} from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPublisherSchema, SITE_URL } from '@/lib/seo/organization';
import { STRATEGIC_AI_CLUSTER_POSTS } from '@/components/blog/AiEducationClusterNav';

export const metadata: Metadata = {
  title: 'AI trong Giáo dục (AI in Education Hub) — Khung Năng Lực & Chiến Lược Thực Chiến | King Dragon Hub',
  description: 'Trung tâm tri thức chuyên sâu về Trí tuệ Nhân tạo trong Giáo dục: Khung năng lực AI giáo viên, lộ trình phổ thông 2026–2027, Khung 5C giao tiếp AI, chiến lược toàn cầu và định hướng AGI.',
  alternates: {
    canonical: `${SITE_URL}/ai-in-education`,
  },
  openGraph: {
    title: 'AI trong Giáo dục — Trung Tâm Tri Thức & Khung Năng Lực Thực Chiến',
    description: 'Hệ sinh thái tri thức AI in Education: Chiến lược toàn cầu, chuẩn giáo viên Việt Nam, phương pháp 5C và công cụ dạy học thực tiễn.',
    url: `${SITE_URL}/ai-in-education`,
    siteName: 'KING DRAGON HUB',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI trong Giáo dục (AI in Education Hub) | King Dragon Hub',
    description: 'Khung năng lực AI giáo viên, lộ trình phổ thông 2026–2027, Khung 5C và chiến lược toàn cầu.',
  },
};

const ADDITIONAL_CLUSTER_RESOURCES = [
  {
    slug: 'nang-luc-ai-cho-giao-vien-tu-chuan-den-hanh-dong',
    title: 'Năng lực AI cho giáo viên: Từ chuẩn đến hành động',
    description: 'Chuyển hóa tiêu chuẩn UNESCO thành hành động cụ thể trong tiết học và kiểm tra đánh giá.',
    badge: 'Sư phạm số',
  },
  {
    slug: 'cong-nghe-giao-duc-tuong-lai-7-xu-huong-lon-den-2035',
    title: 'Công nghệ giáo dục tương lai: 7 xu hướng lớn đến 2035',
    description: 'Dự báo chuyển dịch EdTech 10 năm tới: AI thích ứng, phòng thí nghiệm ảo và lớp học kết hợp.',
    badge: 'Xu hướng 2035',
  },
  {
    slug: 'lich-su-va-tuong-lai-ai-70-nam-tu-dartmouth-den-agent',
    title: 'Lịch sử và tương lai AI: 70 năm từ Dartmouth đến agent',
    description: 'Bức tranh toàn cảnh 70 năm phát triển AI giúp hiểu đúng bản chất và không rơi vào FOMO công nghệ.',
    badge: 'Lịch sử AI',
  },
  {
    slug: 'giao-tiep-voi-ai-dung-ai-ma-khong-phu-thuoc-vao-ai',
    title: 'Giao tiếp với AI: Dùng AI mà không phụ thuộc vào AI',
    description: 'Nguyên tắc giữ vững tư duy độc lập khi sử dụng trợ lý AI trong nghiên cứu và học tập.',
    badge: 'Tư duy tự chủ',
  },
  {
    slug: 'ai-tieu-hoc-lo-trinh-trien-khai-chuong-trinh-chinh-khoa-hieu-qua-g7p7l',
    title: 'AI tiểu học — Lộ trình triển khai chương trình chính khóa hiệu quả',
    description: 'Phương pháp tiếp cận máy học và tư duy thuật toán cho học sinh cấp tiểu học an toàn.',
    badge: 'Cấp Tiểu học',
  },
  {
    slug: 'notebooklm-xay-dung-bo-nao-thu-hai-cho-giao-duc-stem-po4ow',
    title: 'NotebookLM: Xây Dựng "Bộ Não Thứ Hai" Cho Giáo Dục STEM',
    description: 'Ứng dụng AI tổng hợp tài liệu, thiết kế giáo án và kiến tạo kho học liệu cá nhân hóa.',
    badge: 'Bộ não thứ hai',
  },
];

const LEARNING_TRACKS = [
  {
    title: 'Dành cho Nhà Quản lý & Hoạch định',
    target: 'Ban giám hiệu, Trưởng bộ môn, Chuyên viên phòng/sở',
    objective: 'Xây dựng chiến lược đào tạo, khung quy chế đạo đức AI học đường và lộ trình đầu tư hạ tầng.',
    steps: [
      { slug: 'ai-trong-giao-duc-toan-cau-vi-sao-moi-nuoc-di-mot-huong', title: '1. Phân tích đối chiếu chiến lược toàn cầu' },
      { slug: 'ai-trong-giao-duc-pho-thong-trien-khai-tu-2026-2027', title: '2. Kế hoạch triển khai phổ thông 2026–2027' },
      { slug: 'cong-nghe-giao-duc-tuong-lai-7-xu-huong-lon-den-2035', title: '3. Định hình tầm nhìn công nghệ giáo dục đến 2035' },
    ],
  },
  {
    title: 'Dành cho Giáo viên & Chuyên gia Giảng dạy',
    target: 'Giáo viên bộ môn, Giáo viên STEM/Tin học, Giảng viên sư phạm',
    objective: 'Làm chủ công cụ AI, soạn giáo án chuẩn hóa, thiết kế hoạt động trải nghiệm và đánh giá thực chất.',
    steps: [
      { slug: 'khung-nang-luc-ai-cho-giao-vien-viet-nam-lo-trinh-24-tuan', title: '1. Rà soát chuẩn năng lực qua lộ trình 24 tuần' },
      { slug: 'nang-luc-ai-cho-giao-vien-tu-chuan-den-hanh-dong', title: '2. Ứng dụng AI từ chuẩn lý thuyết vào hành động' },
      { slug: 'giao-duc-trong-thoi-dai-ai-dieu-gi-phai-thay-doi', title: '3. Tái cấu trúc mục tiêu và phương pháp kiểm tra' },
    ],
  },
  {
    title: 'Dành cho Học sinh, Phụ huynh & Người tự học',
    target: 'Học sinh phổ thông, Sinh viên, Phụ huynh đồng hành',
    objective: 'Hình thành tư duy phản biện, kỹ năng đặt câu hỏi, sử dụng AI thông minh mà không phụ thuộc.',
    steps: [
      { slug: 'khung-5c-giao-tiep-voi-ai', title: '1. Thực hành phương pháp Khung 5C giao tiếp với AI' },
      { slug: 'giao-tiep-voi-ai-dung-ai-ma-khong-phu-thuoc-vao-ai', title: '2. Nguyên tắc dùng AI giữ vững tư duy cốt lõi' },
      { slug: 'agi-la-gi-nang-luc-ung-dung-va-tuong-lai-con-nguoi', title: '3. Hiểu về AGI và chuẩn bị năng lực tương lai' },
    ],
  },
];

export default function AiInEducationHubPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'AI trong Giáo dục',
        item: `${SITE_URL}/ai-in-education`,
      },
    ],
  };

  const hubSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/ai-in-education`,
    url: `${SITE_URL}/ai-in-education`,
    name: 'AI trong Giáo dục (AI in Education Hub) — King Dragon Hub',
    description: 'Hệ thống tri thức, khung năng lực và chiến lược triển khai Trí tuệ Nhân tạo trong giáo dục Việt Nam.',
    publisher: getPublisherSchema(),
    about: {
      '@type': 'Thing',
      name: 'Artificial Intelligence in Education',
      alternateName: 'AI trong giáo dục',
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: STRATEGIC_AI_CLUSTER_POSTS.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/posts/${post.slug}`,
        name: post.title,
        description: post.tagline,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={hubSchema} />

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-6 max-w-6xl mb-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-foreground/50">
          <Link href="/" className="hover:text-brand-orange transition-colors">Trang chủ</Link>
          <ChevronRight size={13} className="text-foreground/30" />
          <Link href="/blog" className="hover:text-brand-orange transition-colors">Tri thức</Link>
          <ChevronRight size={13} className="text-foreground/30" />
          <span className="text-brand-orange font-semibold">AI trong Giáo dục Hub</span>
        </nav>
      </div>

      {/* Hero Authority Section */}
      <section className="container mx-auto px-6 max-w-6xl mb-16">
        <div className="relative rounded-3xl border border-brand-orange/30 bg-gradient-to-br from-brand-orange/[0.1] via-background to-brand-orange/[0.03] p-8 md:p-14 overflow-hidden shadow-2xl shadow-brand-orange/5">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-xs font-bold uppercase tracking-wider mb-5">
              <Sparkles size={14} className="text-brand-orange" />
              <span>Chuyên Đề Trọng Tâm · Topic Cluster Authority</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08] font-[family-name:var(--font-inter)]">
              AI Trong Giáo Dục: <span className="text-brand-orange">Khung Năng Lực & Chiến Lược Thực Chiến</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-foreground/75">
              Hệ thống tri thức toàn diện kết nối giữa chính sách quốc gia, mô hình thực tiễn toàn cầu và năng lực tác nghiệp hàng ngày của giáo viên. Định hình tư duy làm chủ AI — gìn giữ phẩm chất con người trong kỷ nguyên trí tuệ nhân tạo.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/[0.04] border border-foreground/10">
                <CheckCircle2 size={16} className="text-brand-orange" />
                <span>6 Trụ cột chiến lược</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/[0.04] border border-foreground/10">
                <CheckCircle2 size={16} className="text-brand-orange" />
                <span>Chuẩn hóa GDPT 2018 & UNESCO</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/[0.04] border border-foreground/10">
                <CheckCircle2 size={16} className="text-brand-orange" />
                <span>Lộ trình thực thi 2026–2027</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Strategic Pillars Section (Core Crawl Authority) */}
      <section className="container mx-auto px-6 max-w-6xl mb-20">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-2">
              <Layers size={14} />
              <span>6 Trụ Cột Nền Tảng</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Các Văn Kiện & Khung Tri Thức Trọng Điểm
            </h2>
            <p className="mt-2 text-sm text-foreground/60 max-w-2xl">
              Được xây dựng từ nghiên cứu thực nghiệm và đối chiếu chính sách, đây là 6 tài sản tri thức cốt lõi giải quyết bài toán AI giáo dục từ vĩ mô đến vi mô.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {STRATEGIC_AI_CLUSTER_POSTS.map((post, index) => (
            <article 
              key={post.slug}
              className="group relative flex flex-col justify-between rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 hover:border-brand-orange/40 hover:bg-foreground/[0.04] transition-all duration-300 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] font-bold uppercase tracking-wider">
                    {post.pillar}
                  </span>
                  <span className="font-mono text-xs text-foreground/30 font-semibold">Pillar 0{index + 1}</span>
                </div>

                <h3 className="text-lg font-bold text-foreground group-hover:text-brand-orange transition-colors leading-snug">
                  <Link href={`/posts/${post.slug}`} className="focus:outline-none focus:underline">
                    {post.title}
                  </Link>
                </h3>

                <p className="mt-3 text-xs leading-relaxed text-foreground/65">
                  {post.tagline}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-foreground/10 flex items-center justify-between text-xs">
                <Link 
                  href={`/posts/${post.slug}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-brand-orange group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Khám phá chuyên sâu</span>
                  <ArrowRight size={13} />
                </Link>
                <span className="text-[10px] text-foreground/40 font-mono">Bản chuẩn hóa</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Suggested Learning Tracks / Role Pathways */}
      <section className="container mx-auto px-6 max-w-6xl mb-20">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-2">
            <Workflow size={14} />
            <span>Lộ Trình Đọc Gợi Ý</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Khám Phá Theo Vai Trò & Mục Tiêu Cụ Thể
          </h2>
          <p className="mt-2 text-sm text-foreground/60 max-w-2xl">
            Tối ưu hóa thời gian tiếp thu tri thức theo đúng vai trò công việc để áp dụng ngay vào môi trường sư phạm hoặc học tập của bạn.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {LEARNING_TRACKS.map((track) => (
            <div 
              key={track.title}
              className="rounded-2xl border border-foreground/10 bg-foreground/[0.015] p-6 flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-orange">
                  {track.target}
                </span>
                <h3 className="mt-2 text-lg font-bold text-foreground">
                  {track.title}
                </h3>
                <p className="mt-2 text-xs text-foreground/65 leading-relaxed">
                  {track.objective}
                </p>

                <div className="mt-6 space-y-3">
                  <p className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">Trình tự đọc khuyên nghị:</p>
                  {track.steps.map((step) => (
                    <Link
                      key={step.slug}
                      href={`/posts/${step.slug}`}
                      className="block p-2.5 rounded-xl bg-background border border-foreground/10 hover:border-brand-orange/40 hover:text-brand-orange transition-all text-xs font-medium leading-snug"
                    >
                      {step.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Expanded Cluster Resources (Complementary Articles) */}
      <section className="container mx-auto px-6 max-w-6xl mb-20">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen size={14} />
            <span>Học Liệu Bổ Trợ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Các Bài Phân Tích & Góc Nhìn Liên Quan Trong Cluster
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADDITIONAL_CLUSTER_RESOURCES.map((item) => (
            <Link
              key={item.slug}
              href={`/posts/${item.slug}`}
              className="group p-5 rounded-xl border border-foreground/10 bg-background hover:border-brand-orange/30 hover:bg-foreground/[0.02] transition-all"
            >
              <span className="text-[10px] font-semibold text-brand-orange uppercase tracking-wider">
                {item.badge}
              </span>
              <h4 className="mt-1.5 text-sm font-bold text-foreground group-hover:text-brand-orange transition-colors leading-snug">
                {item.title}
              </h4>
              <p className="mt-2 text-xs text-foreground/60 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Tools & Utilities Integration (Theory into Practice) */}
      <section className="container mx-auto px-6 max-w-6xl mb-12">
        <div className="rounded-3xl border border-foreground/15 bg-gradient-to-r from-foreground/[0.03] to-brand-orange/[0.05] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold uppercase tracking-wider mb-4">
              <Wrench size={14} />
              <span>Chuyển Hóa Thành Sản Phẩm Thực Tế</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              Bộ Công Cụ Tiện Ích Trực Tiếp Dành Cho Giáo Viên
            </h3>
            <p className="mt-3 text-sm text-foreground/70 leading-relaxed">
              Không chỉ dừng lại ở lý thuyết, áp dụng ngay các công cụ được phát triển riêng trong hệ sinh thái King Dragon Hub để tạo phiếu bài tập chuẩn hóa và xử lý học liệu bài giảng.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/utility-hub/worksheet-stem"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-orange text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-orange/90 transition shadow-lg shadow-brand-orange/20"
            >
              <Lightbulb size={16} />
              <span>Tạo Phiếu Bài Tập STEM</span>
            </Link>
            <Link
              href="/utility-hub/pdf-editor"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-foreground/10 border border-foreground/20 text-foreground text-xs font-bold uppercase tracking-wider hover:bg-foreground/15 transition"
            >
              <span>Biên Tập PDF Giáo Án</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
