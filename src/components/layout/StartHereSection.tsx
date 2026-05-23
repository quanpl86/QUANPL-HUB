import Link from 'next/link';
import { ArrowRight, Bot, BrainCircuit, Cpu, GraduationCap } from 'lucide-react';

const pathways = [
  {
    title: 'AI cho học sinh và phụ huynh',
    description: 'Hiểu AI theo cách an toàn, thực tế và phù hợp với lứa tuổi trước khi chọn công cụ hay khóa học.',
    href: '/blog?q=AI',
    icon: Bot,
    signal: 'AI_FOUNDATION',
    cta: 'Bắt đầu với AI',
  },
  {
    title: 'STEM cho giáo viên',
    description: 'Khung tư duy, hoạt động lớp học và workflow AI giúp thiết kế bài học STEM có chiều sâu hơn.',
    href: '/blog?q=STEM',
    icon: GraduationCap,
    signal: 'TEACHER_OS',
    cta: 'Xem lộ trình STEM',
  },
  {
    title: 'Robotics Competition Engineering',
    description: 'Phân tích đề, chiến thuật ghi điểm, thiết kế robot và tư duy kỹ thuật cho WRO / GreenMech.',
    href: '/blog?q=Robotics',
    icon: Cpu,
    signal: 'ROBOTICS_LAB',
    cta: 'Khám phá Robotics',
  },
  {
    title: 'Second Brain và PKM',
    description: 'Xây hệ thống ghi chú, NotebookLM, RAG và kho tri thức cá nhân cho người học công nghệ.',
    href: '/blog?q=Second%20Brain',
    icon: BrainCircuit,
    signal: 'DRAGONMIND',
    cta: 'Mở DragonMind',
  },
];

export function StartHereSection() {
  return (
    <section id="start-here" className="bg-background py-20 border-t border-brand-orange/10">
      <div className="container mx-auto px-6">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end mb-12">
          <div>
            <div className="inline-flex items-center gap-3 border border-brand-orange/30 bg-brand-orange/10 px-4 py-2 text-brand-orange tech-mono mb-5">
              <span className="h-2 w-2 bg-brand-orange" />
              START_HERE
            </div>
            <h2 className="cyber-h2">
              Bắt đầu đúng <span className="text-brand-orange">lộ trình</span>
            </h2>
          </div>
          <p className="body-lg text-muted max-w-3xl lg:ml-auto">
            KING DRAGON HUB là một hệ sinh thái tri thức. Nếu bạn mới đến, hãy chọn một cổng vào phù hợp trước,
            rồi đi tiếp theo chuỗi bài viết, công cụ và framework được kết nối với nhau.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {pathways.map((pathway) => {
            const Icon = pathway.icon;

            return (
              <Link
                key={pathway.signal}
                href={pathway.href}
                className="group relative flex min-h-[300px] flex-col overflow-hidden border border-brand-orange/15 bg-cyber-black/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/50 hover:shadow-[0_16px_40px_rgba(249,115,22,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background cyber-cut"
              >
                <div className="absolute right-0 top-0 h-20 min-w-[5rem] px-6 flex items-center justify-center border-b border-l border-brand-orange/10 bg-brand-orange/5">
                  <span className="tech-mono text-brand-orange/50 !text-[9px] pt-3">{pathway.signal}</span>
                </div>

                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center border border-brand-orange/30 bg-brand-orange/10 text-brand-orange cyber-cut-sm">
                    <Icon size={24} aria-hidden="true" />
                  </div>
                </div>

                <h3 className="font-orbitron text-xl font-bold leading-snug text-foreground">
                  {pathway.title}
                </h3>
                <p className="body-base mt-4 text-muted">
                  {pathway.description}
                </p>

                <div className="mt-auto pt-8 flex items-center justify-between border-t border-brand-orange/10">
                  <span className="font-orbitron text-sm font-bold text-brand-orange">
                    {pathway.cta}
                  </span>
                  <ArrowRight
                    size={18}
                    className="text-brand-orange transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-l-4 border-brand-orange bg-brand-orange/5 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-orbitron text-lg font-bold text-foreground">Muốn xem toàn bộ bản đồ tri thức?</p>
            <p className="body-base text-muted mt-1">
              Vào thư viện để tìm theo chủ đề, sắp xếp bài mới nhất và lần theo các node kiến thức đang mở.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center justify-center gap-2 border border-brand-orange bg-brand-orange px-5 py-3 font-orbitron text-sm font-bold uppercase text-cyber-black transition-all hover:glow-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background cyber-cut-sm"
          >
            Tìm bài viết theo chủ đề
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
