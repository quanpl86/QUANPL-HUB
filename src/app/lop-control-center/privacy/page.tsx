import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowLeft, 
  ExternalLink, 
  Mail, 
  Database, 
  Lock, 
  Trash2, 
  FileCheck2, 
  Share2, 
  HelpCircle 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy – LOP Control Center',
  description: 'Chính sách quyền riêng tư của LOP Control Center, cam kết bảo mật và minh bạch về quyền truy cập dữ liệu Google Workspace tuân thủ Google API Services User Data Policy.',
  alternates: {
    canonical: 'https://kingdragonhub.com/lop-control-center/privacy/',
  },
  openGraph: {
    title: 'Privacy Policy – LOP Control Center | KING DRAGON HUB',
    description: 'Chính sách quyền riêng tư và quy định bảo vệ dữ liệu Google của LOP Control Center.',
    url: 'https://kingdragonhub.com/lop-control-center/privacy/',
    type: 'article',
  },
};

export default function LopPrivacyPolicyPage() {
  const dataAccessedList = [
    'Google Account email address.',
    'Google Sheets và dữ liệu bảng tính.',
    'Google Forms.',
    'Google Drive files.',
    'Google Calendar và các sự kiện liên quan.',
    'Khả năng gửi email thông qua Google Apps Script.',
  ];

  return (
    <div className="relative min-h-[85vh] bg-background text-foreground">
      {/* Background Subtle Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="container relative z-10 mx-auto max-w-4xl px-6 py-16 md:py-24">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-foreground/50">
          <Link href="/" className="hover:text-brand-orange transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link href="/lop-control-center/" className="hover:text-brand-orange transition-colors">LOP Control Center</Link>
          <span>/</span>
          <span className="text-brand-orange">Privacy Policy</span>
        </div>

        {/* Back Link */}
        <Link 
          href="/lop-control-center/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-foreground/70 transition hover:text-brand-orange"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại LOP Control Center
        </Link>

        {/* Header Document */}
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8 md:p-12 shadow-sm backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400">
            <ShieldCheck className="h-4 w-4" />
            Chính sách quyền riêng tư
          </div>

          <h1 className="mt-6 text-3xl font-extrabold uppercase tracking-tight text-foreground md:text-4xl">
            LOP Control Center – Privacy Policy
          </h1>

          <p className="mt-3 text-sm font-mono text-foreground/50">
            Last updated: September 27, 2026
          </p>

          <p className="mt-6 text-base leading-relaxed text-foreground/80 md:text-lg">
            <strong>LOP Control Center</strong> sử dụng một số dịch vụ Google Workspace để cung cấp các chức năng quản lý và tự động hóa.
          </p>
        </div>

        {/* Policy Body */}
        <div className="mt-10 space-y-8">
          {/* Section 1: Google data accessed */}
          <section className="rounded-xl border border-foreground/10 bg-foreground/[0.015] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Database className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Google data accessed</h2>
            </div>
            
            <p className="mt-4 text-sm leading-relaxed text-foreground/75">
              Tùy theo chức năng được sử dụng, ứng dụng có thể truy cập:
            </p>

            <ul className="mt-4 space-y-2.5">
              {dataAccessedList.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-orange shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2: How the data is used */}
          <section className="rounded-xl border border-foreground/10 bg-foreground/[0.015] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">How the data is used</h2>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              Dữ liệu được sử dụng để thực hiện các chức năng của LOP Control Center như xử lý biểu mẫu, cập nhật bảng tính, quản lý tài nguyên, thực thi các tác vụ tự động, quản lý lịch và gửi thông báo.
            </p>
          </section>

          {/* Section 3: Data sharing */}
          <section className="rounded-xl border border-foreground/10 bg-foreground/[0.015] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Share2 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Data sharing</h2>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80">
              <p>
                <strong>LOP Control Center không bán dữ liệu người dùng Google và không sử dụng dữ liệu Google cho mục đích quảng cáo.</strong>
              </p>
              <p>
                Dữ liệu chỉ được xử lý cho các chức năng trực tiếp của hệ thống và không được chia sẻ với bên thứ ba ngoại trừ khi cần thiết để vận hành dịch vụ hoặc theo yêu cầu pháp luật.
              </p>
            </div>
          </section>

          {/* Section 4: Data storage and security */}
          <section className="rounded-xl border border-foreground/10 bg-foreground/[0.015] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Data storage and security</h2>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              Dữ liệu được lưu trong các dịch vụ Google Workspace hoặc các hệ thống cần thiết để vận hành LOP Control Center. Quyền truy cập được giới hạn cho các tài khoản và dịch vụ được phép.
            </p>
          </section>

          {/* Section 5: Data deletion */}
          <section className="rounded-xl border border-foreground/10 bg-foreground/[0.015] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Data deletion</h2>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              Người dùng có thể yêu cầu xem xét hoặc xóa dữ liệu liên quan bằng cách liên hệ:{' '}
              <a 
                href="mailto:plquan.86@gmail.com" 
                className="font-medium text-brand-orange hover:underline"
              >
                plquan.86@gmail.com
              </a>
            </p>
          </section>

          {/* Section 6: Google API Services User Data Policy (Critical for verification) */}
          <section className="rounded-xl border-2 border-brand-orange/40 bg-brand-orange/[0.03] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange border border-brand-orange/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Google API Services User Data Policy</h2>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground/90">
              Việc sử dụng thông tin nhận được từ Google APIs của LOP Control Center tuân thủ{' '}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                target="_blank" 
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-semibold text-brand-orange underline hover:text-brand-orange/80"
              >
                Google API Services User Data Policy <ExternalLink className="h-3.5 w-3.5" />
              </a>
              , bao gồm các yêu cầu <strong>Limited Use</strong>.
            </p>
          </section>

          {/* Section 7: Contact */}
          <section className="rounded-xl border border-foreground/10 bg-foreground/[0.015] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/10 text-foreground/70">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Contact</h2>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              Nếu bạn có bất kỳ câu hỏi nào về Chính sách quyền riêng tư này, vui lòng liên hệ:{' '}
              <a 
                href="mailto:plquan.86@gmail.com" 
                className="font-medium text-brand-orange hover:underline"
              >
                plquan.86@gmail.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer Navigation within lop-control-center */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-foreground/10 pt-6 text-sm">
          <Link 
            href="/lop-control-center/" 
            className="text-foreground/60 transition hover:text-brand-orange inline-flex items-center gap-1"
          >
            &larr; Trang LOP Control Center
          </Link>
          <Link 
            href="/lop-control-center/terms/" 
            className="text-foreground/60 transition hover:text-brand-orange inline-flex items-center gap-1"
          >
            Điều khoản dịch vụ (Terms of Service) &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
