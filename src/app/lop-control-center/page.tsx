import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  ShieldCheck, 
  FileText, 
  Mail, 
  ExternalLink, 
  FileSpreadsheet, 
  Calendar, 
  HardDrive, 
  Send, 
  CheckCircle2, 
  Layers
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'LOP Control Center',
  description: 'Hệ thống tự động hóa phục vụ quản lý lớp học, tài nguyên học tập và các quy trình vận hành giáo dục.',
  alternates: {
    canonical: 'https://kingdragonhub.com/lop-control-center/',
  },
  openGraph: {
    title: 'LOP Control Center | KING DRAGON HUB',
    description: 'Hệ thống tự động hóa phục vụ quản lý lớp học, tài nguyên học tập và các quy trình vận hành giáo dục.',
    url: 'https://kingdragonhub.com/lop-control-center/',
    type: 'website',
  },
};

export default function LopControlCenterPage() {
  const googleServices = [
    {
      title: 'Google Forms',
      desc: 'Tiếp nhận và xử lý dữ liệu biểu mẫu khảo sát, bài nộp và đăng ký.',
      icon: FileSpreadsheet,
      badge: 'Data Collection',
    },
    {
      title: 'Google Sheets',
      desc: 'Lưu trữ, tổng hợp, tính toán và đồng bộ dữ liệu lớp học theo thời gian thực.',
      icon: Layers,
      badge: 'Data Management',
    },
    {
      title: 'Google Drive',
      desc: 'Quản lý, phân loại và lưu trữ các tệp học tập cùng tài nguyên giáo dục an toàn.',
      icon: HardDrive,
      badge: 'Cloud Storage',
    },
    {
      title: 'Google Calendar',
      desc: 'Quản lý lịch giảng dạy, buổi họp và nhắc lịch các sự kiện quan trọng.',
      icon: Calendar,
      badge: 'Scheduling',
    },
    {
      title: 'Google Apps Script & Email Service',
      desc: 'Thực thi các tiến trình tự động hóa nền và gửi email thông báo học vụ.',
      icon: Send,
      badge: 'Automation & Alerts',
    },
  ];

  return (
    <div className="relative min-h-[85vh] bg-background text-foreground">
      {/* Background Subtle Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-orange/10 blur-[120px]" />

      <div className="container relative z-10 mx-auto max-w-4xl px-6 py-16 md:py-24">
        {/* Breadcrumb / Top badge */}
        <div className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-foreground/50">
          <Link href="/" className="hover:text-brand-orange transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-brand-orange">LOP Control Center</span>
        </div>

        {/* Hero Section */}
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8 md:p-12 shadow-sm backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-3.5 py-1 text-xs font-semibold text-brand-orange">
            <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
            Hệ thống quản lý nội bộ
          </div>

          <h1 className="mt-6 text-3xl font-extrabold uppercase tracking-tight text-foreground md:text-4xl lg:text-5xl">
            LOP Control Center
          </h1>

          <p className="mt-6 text-base leading-relaxed text-foreground/80 md:text-lg">
            <strong>LOP Control Center</strong> là hệ thống tự động hóa phục vụ quản lý lớp học, tài nguyên học tập và các quy trình vận hành giáo dục.
          </p>

          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            Hệ thống tích hợp chặt chẽ với các dịch vụ <strong>Google Workspace</strong> để xử lý dữ liệu biểu mẫu, bảng tính, tài liệu, lịch và các tác vụ tự động hóa chuyên sâu.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Hệ thống hiện được sử dụng cho hoạt động quản lý và vận hành nội bộ.</span>
          </div>
        </div>

        {/* Services & Integrations */}
        <div className="mt-12">
          <h2 className="text-xl font-bold uppercase tracking-tight text-foreground md:text-2xl">
            Tích hợp dịch vụ Google Workspace
          </h2>
          <p className="mt-2 text-sm text-foreground/60">
            LOP Control Center có thể kết nối và sử dụng các dịch vụ Google sau đây nhằm phục vụ quy trình giáo dục:
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {googleServices.map((service) => {
              const Icon = service.icon;
              return (
                <div 
                  key={service.title} 
                  className="rounded-xl border border-foreground/10 bg-foreground/[0.015] p-5 transition hover:border-brand-orange/40 hover:bg-foreground/[0.03]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5 text-brand-orange">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-foreground/5 text-foreground/60 border border-foreground/10">
                      {service.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{service.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">{service.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal Links Card */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Link 
            href="/lop-control-center/privacy/" 
            className="group flex flex-col justify-between rounded-xl border border-foreground/10 bg-foreground/[0.02] p-6 transition hover:border-brand-orange hover:bg-foreground/[0.04]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <ExternalLink className="h-4 w-4 text-foreground/40 group-hover:text-brand-orange transition-colors" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground group-hover:text-brand-orange transition-colors">
                Chính sách quyền riêng tư
              </h3>
              <p className="mt-1.5 text-xs text-foreground/50">/lop-control-center/privacy/</p>
              <p className="mt-3 text-sm text-foreground/70">
                Minh bạch về phạm vi quyền Google OAuth, cách lưu trữ, bảo mật và quyền xóa dữ liệu người dùng.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center text-sm font-semibold text-brand-orange">
              Xem Privacy Policy &rarr;
            </span>
          </Link>

          <Link 
            href="/lop-control-center/terms/" 
            className="group flex flex-col justify-between rounded-xl border border-foreground/10 bg-foreground/[0.02] p-6 transition hover:border-brand-orange hover:bg-foreground/[0.04]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FileText className="h-5 w-5" />
                </div>
                <ExternalLink className="h-4 w-4 text-foreground/40 group-hover:text-brand-orange transition-colors" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground group-hover:text-brand-orange transition-colors">
                Điều khoản dịch vụ
              </h3>
              <p className="mt-1.5 text-xs text-foreground/50">/lop-control-center/terms/</p>
              <p className="mt-3 text-sm text-foreground/70">
                Quy định sử dụng hệ thống, tính hợp lệ của tài khoản kết nối và trách nhiệm người dùng.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center text-sm font-semibold text-brand-orange">
              Xem Terms of Service &rarr;
            </span>
          </Link>
        </div>

        {/* Contact Info */}
        <div className="mt-12 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Thông tin liên hệ & Hỗ trợ kỹ thuật</h4>
              <p className="text-sm text-foreground/70">
                Mọi thắc mắc hoặc yêu cầu hỗ trợ vận hành, vui lòng liên hệ:{' '}
                <a 
                  href="mailto:plquan.86@gmail.com" 
                  className="font-medium text-brand-orange hover:underline"
                >
                  plquan.86@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
