import React from 'react';
import { Bot, Cpu, BookOpen, Database, BrainCircuit, Globe, Rocket, Layers } from 'lucide-react';
import Link from 'next/link';

const ecosystemPillars = [
  {
    id: 'ai-coding',
    title: 'Lập Trình & AI',
    icon: <BrainCircuit className="w-8 h-8 text-brand-orange" />,
    description: 'Xây dựng nền tảng tư duy máy tính thông qua lập trình trực quan (Blockly, Scratch) và ngôn ngữ bậc cao (Python). Tích hợp Generative AI để cá nhân hóa việc học.',
    items: ['Tư duy Máy tính (CT)', 'Lập trình Python / Blockly', 'Tích hợp AI Sư phạm'],
    link: '/blog?category=ai-coding',
    color: 'from-orange-500/20 to-orange-500/5'
  },
  {
    id: 'robotics',
    title: 'Robotics & Giả lập',
    icon: <Cpu className="w-8 h-8 text-blue-500" />,
    description: 'Hệ thống nền tảng giả lập 3D chuẩn thi đấu quốc tế. Giúp học sinh thực hành Robotics và IoT mà không bị rào cản về thiết bị phần cứng.',
    items: ['Nền tảng giả lập 3D', 'Sa bàn thử thách thi đấu', 'Mô phỏng Cảm biến IoT'],
    link: '/blog?category=robotics',
    color: 'from-blue-500/20 to-blue-500/5'
  },
  {
    id: 'pedagogy',
    title: 'Phương Pháp Khung',
    icon: <Layers className="w-8 h-8 text-emerald-500" />,
    description: 'Áp dụng các chuẩn giáo dục quốc tế với phương pháp "Spiral Curriculum" (Xoắn ốc học thuật) để học sinh nắm bắt kiến thức bền vững từ lớp 3 đến lớp 12.',
    items: ['Khung chương trình chuẩn', 'Spiral Curriculum', 'Lesson Plans chuẩn'],
    link: '/blog?category=pedagogy',
    color: 'from-emerald-500/20 to-emerald-500/5'
  },
  {
    id: 'knowledge',
    title: 'Thư Viện Trí Tuệ',
    icon: <Database className="w-8 h-8 text-purple-500" />,
    description: 'Kho lưu trữ bài viết chuyên sâu, lộ trình học tập, tài liệu hướng dẫn giáo viên và review các giải pháp EdTech tiên tiến nhất hiện nay.',
    items: ['Lộ trình học tập (Learning Paths)', 'Tài liệu Giáo viên', 'Đánh giá EdTech'],
    link: '/blog',
    color: 'from-purple-500/20 to-purple-500/5'
  }
];

export function EcosystemMap() {
  return (
    <section className="py-24 bg-background relative overflow-hidden border-t border-foreground/10">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-orange/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 mb-6">
            <Globe className="w-4 h-4 text-brand-orange" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/80">King Dragon Ecosystem</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-inter)] tracking-tight text-foreground mb-6">
            Bản Đồ Hệ Sinh Thái <span className="text-brand-orange">Giáo Dục STEM</span>
          </h2>
          <p className="text-lg text-foreground/70 font-light max-w-2xl mx-auto">
            Chúng tôi không chỉ viết blog. KING DRAGON HUB là một hệ sinh thái toàn diện kết nối giữa công nghệ cốt lõi và phương pháp sư phạm hiện đại.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ecosystemPillars.map((pillar) => (
            <div 
              key={pillar.id}
              className="group relative p-8 rounded-2xl border border-foreground/10 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
            >
              {/* Gradient overlay */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${pillar.color} blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              <div className="mb-6 inline-block p-4 rounded-xl bg-background border border-foreground/10 shadow-sm relative z-10">
                {pillar.icon}
              </div>
              
              <h3 className="text-xl font-bold font-[family-name:var(--font-inter)] text-foreground mb-4 relative z-10">
                {pillar.title}
              </h3>
              
              <p className="text-sm text-foreground/70 mb-6 leading-relaxed relative z-10">
                {pillar.description}
              </p>
              
              <ul className="space-y-3 mb-8 relative z-10">
                {pillar.items.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-orange/60"></div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <Link 
                href={pillar.link}
                className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-brand-orange transition-colors relative z-10"
              >
                Khám phá ngay 
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
