import Link from 'next/link';
import { ArrowRight, Bot, BrainCircuit, Cpu, GraduationCap } from 'lucide-react';

const pathways = [
  {
    title: 'Khám phá AI an toàn',
    description: 'Hiểu AI theo cách thực tế, có trách nhiệm và phù hợp với lứa tuổi trước khi chọn công cụ hoặc khóa học.',
    href: '/blog?q=AI',
    icon: Bot,
    signal: 'HỌC SINH & PHỤ HUYNH',
    cta: 'Khám phá AI',
    color: 'from-orange-500/20 to-orange-500/5'
  },
  {
    title: 'Thiết kế bài học STEM & AI',
    description: 'Khung phương pháp, hoạt động lớp học và công cụ AI giúp giáo viên thiết kế trải nghiệm học tập có chiều sâu.',
    href: '/blog?q=STEM',
    icon: GraduationCap,
    signal: 'GIÁO VIÊN',
    cta: 'Xem lộ trình giáo viên',
    color: 'from-emerald-500/20 to-emerald-500/5'
  },
  {
    title: 'Thi đấu & kỹ thuật Robot',
    description: 'Phân tích đề, chiến thuật ghi điểm, thiết kế robot và tư duy kỹ thuật cho WRO / GreenMech.',
    href: '/blog?q=Robotics',
    icon: Cpu,
    signal: 'ĐỘI ROBOT',
    cta: 'Xem lộ trình Robot',
    color: 'from-blue-500/20 to-blue-500/5'
  },
  {
    title: 'Xây dựng hệ thống tri thức cá nhân',
    description: 'Xây hệ thống ghi chú, NotebookLM, RAG và kho tri thức cá nhân cho người học công nghệ.',
    href: '/blog?q=Second%20Brain',
    icon: BrainCircuit,
    signal: 'NGƯỜI TỰ HỌC',
    cta: 'Xem lộ trình tự học',
    color: 'from-purple-500/20 to-purple-500/5'
  },
];

export function StartHereSection() {
  return (
    <section id="start-here" className="bg-background py-20 border-t border-brand-orange/20">
      <div className="container mx-auto px-6">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/5 border border-brand-orange/20 mb-5">
              <span className="h-2 w-2 rounded-full bg-brand-orange" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">BẮT ĐẦU TẠI ĐÂY</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-inter)] tracking-tight text-foreground">
              Bắt đầu theo <span className="text-brand-orange">mục tiêu của bạn</span>
            </h2>
          </div>
          <p className="body-lg text-muted max-w-3xl lg:ml-auto">
            Nếu đây là lần đầu bạn đến KingDragonHub, hãy chọn một lộ trình phù hợp với mục tiêu của mình.
            Mỗi lộ trình kết nối các bài viết, công cụ và phương pháp liên quan để bạn có thể khám phá tiếp theo từng bước.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {pathways.map((pathway) => {
            const Icon = pathway.icon;

            return (
              <Link
                key={pathway.signal}
                href={pathway.href}
                className="group relative flex min-h-[300px] flex-col p-8 rounded-2xl border border-foreground/10 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
              >
                {/* Gradient overlay */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${pathway.color} blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="mb-6 flex items-center justify-between relative z-10">
                  <div className="inline-flex p-4 rounded-xl bg-background border border-foreground/10 shadow-sm text-foreground/80 group-hover:text-brand-orange transition-colors">
                    <Icon size={28} aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 bg-foreground/5 px-2 py-1 rounded-md">{pathway.signal}</span>
                </div>

                <h3 className="text-xl font-bold font-[family-name:var(--font-inter)] text-foreground mb-4 relative z-10 leading-snug">
                  {pathway.title}
                </h3>
                
                <p className="text-sm text-foreground/70 mb-8 leading-relaxed relative z-10">
                  {pathway.description}
                </p>

                <div className="mt-auto pt-6 flex items-center justify-between border-t border-foreground/10 relative z-10">
                  <span className="text-sm font-bold text-foreground group-hover:text-brand-orange transition-colors">
                    {pathway.cta}
                  </span>
                  <ArrowRight
                    size={18}
                    className="text-foreground/50 group-hover:text-brand-orange transition-all duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col md:flex-row gap-6 items-center justify-between bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-8">
          <div>
            <p className="text-xl font-bold font-[family-name:var(--font-inter)] text-foreground">Muốn khám phá theo lĩnh vực?</p>
            <p className="text-sm text-foreground/70 mt-2 max-w-2xl leading-relaxed">
              Xem cách AI, STEM, Robot, khoa học máy tính và giáo dục được kết nối trong hệ thống nội dung.
            </p>
          </div>
          <Link
            href="/#knowledge-fields"
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-brand-orange text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-brand-orange/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:shadow-lg hover:shadow-brand-orange/20"
          >
            Xem bản đồ tri thức
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
