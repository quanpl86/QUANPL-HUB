import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  FileText, 
  ArrowLeft, 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  ShieldAlert 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service – LOP Control Center',
  description: 'Điều khoản dịch vụ và quy định sử dụng hệ thống LOP Control Center cho quản lý và tự động hóa vận hành giáo dục.',
  alternates: {
    canonical: 'https://kingdragonhub.com/lop-control-center/terms/',
  },
  openGraph: {
    title: 'Terms of Service – LOP Control Center | KING DRAGON HUB',
    description: 'Điều khoản dịch vụ của hệ thống LOP Control Center.',
    url: 'https://kingdragonhub.com/lop-control-center/terms/',
    type: 'article',
  },
};

export default function LopTermsOfServicePage() {
  const termsList = [
    {
      title: 'Mục đích sử dụng hợp lệ',
      content: 'Người dùng chỉ được sử dụng hệ thống cho mục đích được cho phép và phải có quyền hợp lệ đối với dữ liệu, tài liệu và tài khoản Google được kết nối.',
      icon: CheckCircle,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Nghiêm cấm truy cập trái phép',
      content: 'Người dùng không được sử dụng hệ thống để truy cập trái phép dữ liệu hoặc tài nguyên của người khác.',
      icon: ShieldAlert,
      iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      title: 'Cập nhật & Thay đổi chức năng',
      content: 'Các chức năng của LOP Control Center có thể thay đổi hoặc được cập nhật theo nhu cầu vận hành thực tế.',
      icon: RefreshCw,
      iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Phụ thuộc dịch vụ bên thứ ba',
      content: 'Hệ thống phụ thuộc một phần vào các dịch vụ của Google Workspace và Google Apps Script; do đó một số chức năng có thể bị ảnh hưởng bởi thay đổi hoặc gián đoạn từ các dịch vụ này.',
      icon: AlertTriangle,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="relative min-h-[85vh] bg-background text-foreground">
      {/* Background Subtle Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />

      <div className="container relative z-10 mx-auto max-w-4xl px-6 py-16 md:py-24">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-foreground/50">
          <Link href="/" className="hover:text-brand-orange transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link href="/lop-control-center/" className="hover:text-brand-orange transition-colors">LOP Control Center</Link>
          <span>/</span>
          <span className="text-brand-orange">Terms of Service</span>
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
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400">
            <FileText className="h-4 w-4" />
            Điều khoản dịch vụ
          </div>

          <h1 className="mt-6 text-3xl font-extrabold uppercase tracking-tight text-foreground md:text-4xl">
            LOP Control Center – Terms of Service
          </h1>

          <p className="mt-3 text-sm font-mono text-foreground/50">
            Last updated: September 27, 2026
          </p>

          <p className="mt-6 text-base leading-relaxed text-foreground/80 md:text-lg">
            <strong>LOP Control Center</strong> là hệ thống hỗ trợ quản lý và tự động hóa các quy trình giáo dục và vận hành liên quan.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="mt-10 space-y-6">
          {termsList.map((term, index) => {
            const Icon = term.icon;
            return (
              <div 
                key={term.title} 
                className="rounded-xl border border-foreground/10 bg-foreground/[0.015] p-6 md:p-8"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${term.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    {index + 1}. {term.title}
                  </h2>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                  {term.content}
                </p>
              </div>
            );
          })}

          {/* Contact Section */}
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.015] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/10 text-foreground/70">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">5. Liên hệ & Giải đáp</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              Mọi câu hỏi liên quan đến điều khoản sử dụng có thể gửi tới:{' '}
              <a 
                href="mailto:plquan.86@gmail.com" 
                className="font-medium text-brand-orange hover:underline"
              >
                plquan.86@gmail.com
              </a>
            </p>
          </div>
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
            href="/lop-control-center/privacy/" 
            className="text-foreground/60 transition hover:text-brand-orange inline-flex items-center gap-1"
          >
            Chính sách quyền riêng tư (Privacy Policy) &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
