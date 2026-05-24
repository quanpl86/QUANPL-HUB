import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Mail, BrainCircuit, GraduationCap, Code2, Layers, Cpu, CheckCircle2 } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (id !== 'quanpl86') return { title: 'Author Not Found' };

  return {
    title: 'Phan Long Quân - System Architect & STEM Educator',
    description: 'Chuyên gia Kiến trúc Hệ thống & Nhà giáo dục STEM. Người xây dựng KING DRAGON HUB và định hình phương pháp giảng dạy công nghệ cho thế hệ trẻ.',
    alternates: {
      canonical: `https://kingdragonhub.com/author/${id}`,
    },
  };
}

export default async function AuthorProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Currently we only have one main author. If ID doesn't match, return 404.
  if (id !== 'quanpl86') notFound();

  const authorData = {
    name: 'Phan Long Quân',
    alias: 'KING DRAGON',
    role: 'System Architect & STEM Educator',
    bio: 'Chuyên gia Kiến trúc Hệ thống & Nhà giáo dục STEM với sứ mệnh định hình lại cách tiếp cận kiến thức công nghệ cho thế hệ trẻ. Tập trung nghiên cứu và ứng dụng Trí tuệ Nhân tạo (AI), Tư duy máy tính (Computational Thinking) và phương pháp học thuật Xoắn ốc (Spiral Curriculum) vào môi trường giáo dục từ cấp Tiểu học đến THPT.',
    avatarUrl: '/icon.png', // Using the logo as avatar for now
    linkedin: 'https://www.linkedin.com/in/long-qu%C3%A2n-phan-6a9388125/',
    skills: [
      { name: 'Tư duy máy tính (CT)', icon: BrainCircuit },
      { name: 'Khung giáo trình IOSTEM', icon: Layers },
      { name: 'Lập trình Python & Web', icon: Code2 },
      { name: 'Robotics (WRO/FLL)', icon: Cpu },
      { name: 'Phương pháp sư phạm STEM', icon: GraduationCap }
    ],
    experience: [
      'Nghiên cứu & phát triển (R&D) các giải pháp EdTech, nền tảng học tập trực tuyến.',
      'Thiết kế kiến trúc phần mềm, tích hợp AI (Generative AI, RAG, NotebookLM).',
      'Xây dựng lộ trình học tập công nghệ, tư vấn triển khai khoá học cho các tổ chức giáo dục.',
      'Sáng lập và phát triển KING DRAGON HUB - Hệ sinh thái chia sẻ kiến thức chuyên sâu.'
    ]
  };

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: authorData.name,
    alternateName: authorData.alias,
    jobTitle: authorData.role,
    url: `https://kingdragonhub.com/author/${id}`,
    image: `https://kingdragonhub.com${authorData.avatarUrl}`,
    description: authorData.bio,
    sameAs: [
      authorData.linkedin,
      'https://github.com/quanpl86'
    ],
    knowsAbout: [
      'STEM Education',
      'Robotics',
      'Artificial Intelligence',
      'Software Architecture',
      'Computational Thinking',
      'Python',
      'Next.js'
    ],
    alumniOf: {
      '@type': 'Organization',
      name: 'Educational Technology Sector'
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <JsonLd data={personSchema} />
      
      <div className="container mx-auto px-6 max-w-5xl">
        
        {/* Profile Header Card */}
        <div className="relative rounded-3xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden mb-12">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand-orange/20 to-purple-500/20 blur-xl opacity-50"></div>
          
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="shrink-0 relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background overflow-hidden bg-brand-orange/10 flex items-center justify-center shadow-2xl">
                <Image 
                  src={authorData.avatarUrl} 
                  alt={authorData.name}
                  width={160}
                  height={160}
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-background rounded-full" title="Available for consulting"></div>
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-grow">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-bold uppercase tracking-wider mb-4">
                {authorData.alias}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-inter)] text-foreground mb-2">
                {authorData.name}
              </h1>
              <p className="text-lg md:text-xl text-foreground/70 font-medium mb-6">
                {authorData.role}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <a 
                  href={authorData.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-2 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors border border-[#0A66C2]/20 font-bold text-sm"
                >
                  LinkedIn Profile
                </a>
                <a 
                  href="mailto:contact@kingdragonhub.com" 
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-colors border border-brand-orange/20 font-medium text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-2xl font-bold font-[family-name:var(--font-inter)] text-foreground mb-6 flex items-center gap-2">
                <span className="w-8 h-1 bg-brand-orange rounded-full"></span>
                Tiểu sử
              </h2>
              <p className="text-foreground/80 leading-relaxed text-lg">
                {authorData.bio}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-[family-name:var(--font-inter)] text-foreground mb-6 flex items-center gap-2">
                <span className="w-8 h-1 bg-brand-orange rounded-full"></span>
                Kinh nghiệm & Chuyên môn
              </h2>
              <div className="space-y-4">
                {authorData.experience.map((exp, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-foreground/10 bg-foreground/[0.02]">
                    <div className="mt-1">
                      <CheckCircle2 className="w-5 h-5 text-brand-orange" />
                    </div>
                    <p className="text-foreground/80 leading-relaxed">{exp}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02]">
              <h3 className="text-lg font-bold font-[family-name:var(--font-inter)] text-foreground mb-6">Lĩnh vực cốt lõi</h3>
              <div className="space-y-4">
                {authorData.skills.map((skill, idx) => {
                  const Icon = skill.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/70">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-foreground/80 font-medium">{skill.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-brand-orange/20 bg-brand-orange/5">
              <h3 className="text-lg font-bold font-[family-name:var(--font-inter)] text-brand-orange mb-4">Mục tiêu hướng tới</h3>
              <p className="text-sm text-foreground/70 leading-relaxed mb-6">
                &ldquo;Ứng dụng công nghệ không chỉ là dạy học sinh biết code, mà là trang bị cho các em tư duy giải quyết
                vấn đề bằng máy tính trong một thế giới được vận hành bởi AI.&rdquo;
              </p>
              <Link href="/blog" className="text-sm font-bold text-brand-orange hover:underline flex items-center gap-1">
                Đọc các bài viết của tôi &rarr;
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
