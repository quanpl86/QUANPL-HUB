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
  Layers,
  LayoutDashboard,
  GraduationCap,
  ArrowUpRight,
  Sparkles,
  Sliders,
  Workflow,
  BookOpen,
  ClipboardCheck,
  Check,
  Radio,
  Server
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'LOP Control Center & Portals | KING DRAGON HUB',
  description: 'Cổng điều hành LOP Control Center, Teacher Portal và Student Portal - Hệ thống tự động hóa quản lý lớp học và tài nguyên giáo dục.',
  alternates: {
    canonical: 'https://kingdragonhub.com/lop-control-center/',
  },
  openGraph: {
    title: 'LOP Control Center & Portals | KING DRAGON HUB',
    description: 'Cổng điều hành LOP Control Center, Teacher Portal và Student Portal - Hệ thống tự động hóa quản lý lớp học và tài nguyên giáo dục.',
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

  const LOP_MAIN_URL = 'https://script.google.com/macros/s/AKfycbxyVkR5zsCbNALt62-E_t9lRMybA1p8PLdAvReuQrt2SA76vtXpN6Qd4X-awbQIZh6c/exec';
  const TEACHER_PORTAL_URL = 'https://script.google.com/macros/s/AKfycbxFI1NAkMo-FGI4q3uoA7nfOedDaRLOG2-xvdbmIv-a19mpMVm6kHAwEgEJ-BohtTBu/exec';
  const STUDENT_PORTAL_URL = 'https://script.google.com/macros/s/AKfycbxY4ioAwO0bhJY8QIzd9PPA9qSQPPBMTuYKtx9GWGZXW_rdQUnRcPBhCVh1H5NdBzy99g/exec';

  return (
    <div className="relative min-h-[85vh] bg-background text-foreground">
      {/* Background Subtle Glows */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-orange/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-72 w-72 rounded-full bg-blue-500/5 blur-[120px]" />

      <div className="container relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-12 md:py-20">
        {/* Breadcrumb / Top badge */}
        <div className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-foreground/50">
          <Link href="/" className="hover:text-brand-orange transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-brand-orange">LOP Control Center</span>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-b from-foreground/[0.03] to-foreground/[0.01] p-6 sm:p-10 md:p-12 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-3.5 py-1 text-xs font-semibold text-brand-orange">
              <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
              Hệ thống quản lý & vận hành nội bộ
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <Radio className="h-3 w-3 animate-ping" />
              <span>Sẵn sàng kết nối Google Workspace</span>
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold uppercase tracking-tight text-foreground sm:text-4xl md:text-5xl">
            LOP Control Center
          </h1>

          <p className="mt-5 text-base leading-relaxed text-foreground/80 sm:text-lg max-w-3xl">
            <strong>LOP Control Center</strong> là giải pháp tự động hóa tập trung phục vụ quản lý lớp học, điều phối dữ liệu học tập và tối ưu hóa các quy trình vận hành giáo dục số.
          </p>

          <p className="mt-3 text-sm leading-relaxed text-foreground/70 max-w-3xl">
            Nền tảng tích hợp sâu với <strong>Google Workspace</strong> (Forms, Sheets, Drive, Calendar, Apps Script) mang đến trải nghiệm đồng bộ tức thời, an toàn và bảo mật cho cả người quản trị, giảng viên và học viên.
          </p>
        </div>

        {/* SECTION: 3 CARDS PORTAL LAUNCHPAD */}
        <div className="mt-12 sm:mt-16">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-orange">
                <Sparkles className="h-3.5 w-3.5" />
                Cổng truy cập ứng dụng
              </div>
              <h2 className="mt-1 text-2xl font-extrabold uppercase tracking-tight text-foreground md:text-3xl">
                Hệ Sinh Thái Webapp LOP
              </h2>
            </div>
            <p className="text-xs text-foreground/60 max-w-xs sm:text-right">
              Nhấp trực tiếp vào cổng phù hợp với vai trò của bạn để truy cập webapp trên Google Apps Script.
            </p>
          </div>

          {/* CARD 1: TOP LARGE CARD - LOP CONTROL CENTER & OP CENTER */}
          <div className="relative group rounded-3xl border-2 border-brand-orange/40 bg-gradient-to-br from-brand-orange/[0.08] via-foreground/[0.02] to-foreground/[0.01] p-6 sm:p-9 md:p-10 shadow-lg shadow-brand-orange/5 transition-all duration-300 hover:border-brand-orange hover:shadow-brand-orange/10">
            {/* Subtle glow border */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-brand-orange/15 blur-3xl pointer-events-none group-hover:bg-brand-orange/25 transition-all duration-500" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-brand-orange/30 bg-brand-orange/15 text-brand-orange shadow-inner">
                    <LayoutDashboard className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-orange">
                      Cụm điều hành trung tâm • Dual Engine
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight">
                      LOP (LOP Control Center)
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Production
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm sm:text-base leading-relaxed text-foreground/80 max-w-4xl">
                Cụm quản trị và điều phối cốt lõi của toàn bộ hệ thống lớp học, kết hợp chặt chẽ giữa <strong>Control Center</strong> (Quản trị cấu hình & dữ liệu) và <strong>Op Center</strong> (Vận hành tác vụ tự động & luồng học vụ).
              </p>

              {/* Sub-modules dual cards */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-foreground/10 bg-background/50 p-4.5 sm:p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5 text-brand-orange">
                    <Sliders className="h-5 w-5 shrink-0" />
                    <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">
                      Control Center (Trung tâm Quản trị)
                    </h4>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs sm:text-sm text-foreground/75">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                      <span>Cấu hình thông số hệ thống, khóa học và phân quyền giáo viên / học viên.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                      <span>Quản lý kho biểu mẫu Google Forms, trang dữ liệu Sheets và thư mục Drive.</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-foreground/10 bg-background/50 p-4.5 sm:p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5 text-brand-orange">
                    <Workflow className="h-5 w-5 shrink-0" />
                    <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">
                      Op Center (Trung tâm Vận hành)
                    </h4>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs sm:text-sm text-foreground/75">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                      <span>Kích hoạt các luồng tự động hóa (Triggers, Batch Scripts, Email Dispatcher).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                      <span>Giám sát tiến trình nộp bài, điểm danh và đồng bộ báo cáo học vụ tự động.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom action bar */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-foreground/10">
                <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/60">
                  <span className="rounded-md bg-foreground/5 px-2.5 py-1 font-mono border border-foreground/10">
                    Google Apps Script Webapp
                  </span>
                  <span className="rounded-md bg-foreground/5 px-2.5 py-1 font-mono border border-foreground/10">
                    OAuth 2.0 Verified
                  </span>
                  <span className="rounded-md bg-foreground/5 px-2.5 py-1 font-mono border border-foreground/10">
                    Full Admin Access
                  </span>
                </div>

                <a 
                  href={LOP_MAIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-orange/20 transition-all duration-200 hover:from-brand-orange hover:to-orange-500 hover:shadow-lg hover:shadow-brand-orange/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Truy cập LOP Control Center</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* BOTTOM 2 CARDS: TEACHER PORTAL & STUDENT PORTAL */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 2: TEACHER PORTAL */}
            <div className="relative group flex flex-col justify-between rounded-3xl border border-blue-500/25 bg-gradient-to-br from-blue-500/[0.06] via-foreground/[0.02] to-transparent p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-blue-500/60 hover:shadow-md hover:shadow-blue-500/10">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                    Giảng viên & Trợ giảng
                  </span>
                </div>

                <h3 className="mt-5 text-xl sm:text-2xl font-extrabold text-foreground group-hover:text-blue-400 transition-colors">
                  Teacher Portal
                </h3>

                <p className="mt-2.5 text-sm leading-relaxed text-foreground/75">
                  Không gian làm việc số dành riêng cho Thầy Cô và Trợ giảng: kiểm soát lớp học, tương tác chuyên môn và quản lý tiến độ giảng dạy hiệu quả.
                </p>

                <div className="mt-5 space-y-2.5 border-t border-foreground/10 pt-5">
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/75">
                    <ClipboardCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Quản lý danh sách lớp học, điểm danh và theo dõi chuyên cần.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/75">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Chấm điểm bài nộp, nhận xét chi tiết và gửi thông báo học tập.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/75">
                    <FileSpreadsheet className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Tự động cập nhật bảng điểm và lịch trình vào Google Workspace.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-foreground/10 flex items-center justify-between gap-3">
                <span className="text-xs text-foreground/50 font-mono">
                  Role: Teacher / TA
                </span>
                <a 
                  href={TEACHER_PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500 hover:text-white px-5 py-2.5 text-sm font-bold text-blue-400 transition-all duration-200 shadow-sm hover:shadow-blue-500/20"
                >
                  <span>Mở Teacher Portal</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* CARD 3: STUDENT PORTAL */}
            <div className="relative group flex flex-col justify-between rounded-3xl border border-purple-500/25 bg-gradient-to-br from-purple-500/[0.06] via-foreground/[0.02] to-transparent p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-purple-500/60 hover:shadow-md hover:shadow-purple-500/10">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/15 text-purple-400">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-400">
                    Học viên & Phụ huynh
                  </span>
                </div>

                <h3 className="mt-5 text-xl sm:text-2xl font-extrabold text-foreground group-hover:text-purple-400 transition-colors">
                  Student Portal
                </h3>

                <p className="mt-2.5 text-sm leading-relaxed text-foreground/75">
                  Cổng thông tin học tập cá nhân hóa dành cho Học viên: chủ động nắm bắt lộ trình, thời khóa biểu, tài liệu học vụ và kết quả học tập liên tục.
                </p>

                <div className="mt-5 space-y-2.5 border-t border-foreground/10 pt-5">
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/75">
                    <Calendar className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Tra cứu lịch học, phòng học và các sự kiện khóa học trực tuyến.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/75">
                    <HardDrive className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Truy cập kho slide bài giảng, giáo trình và tài liệu đính kèm.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/75">
                    <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Nộp bài tập, theo dõi điểm số và xem phản hồi của giảng viên.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-foreground/10 flex items-center justify-between gap-3">
                <span className="text-xs text-foreground/50 font-mono">
                  Role: Student / Learner
                </span>
                <a 
                  href={STUDENT_PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500 hover:text-white px-5 py-2.5 text-sm font-bold text-purple-400 transition-all duration-200 shadow-sm hover:shadow-purple-500/20"
                >
                  <span>Mở Student Portal</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Services & Integrations */}
        <div className="mt-16 sm:mt-20">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/60">
            <Server className="h-4 w-4 text-brand-orange" />
            Hạ tầng kết nối
          </div>
          <h2 className="mt-1 text-xl font-bold uppercase tracking-tight text-foreground md:text-2xl">
            Tích hợp dịch vụ Google Workspace
          </h2>
          <p className="mt-2 text-sm text-foreground/60">
            Hệ thống LOP vận hành dựa trên kiến trúc kết nối và đồng bộ tự động với các dịch vụ cốt lõi của Google:
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {googleServices.map((service) => {
              const Icon = service.icon;
              return (
                <div 
                  key={service.title} 
                  className="rounded-2xl border border-foreground/10 bg-foreground/[0.015] p-5 transition hover:border-brand-orange/40 hover:bg-foreground/[0.03]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/5 text-brand-orange">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-foreground/5 text-foreground/60 border border-foreground/10">
                      {service.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold text-foreground text-sm">{service.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-foreground/70">{service.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal Links Card */}
        <div className="mt-12 sm:mt-16">
          <h2 className="text-lg font-bold uppercase tracking-tight text-foreground/80">
            Chính sách bảo mật & Điều khoản dịch vụ
          </h2>
          <p className="mt-1 text-xs text-foreground/60">
            Minh bạch về cơ chế cấp quyền, quản lý tài nguyên và tiêu chuẩn an toàn thông tin theo yêu cầu Google OAuth Branding:
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Link 
              href="/lop-control-center/privacy/" 
              className="group flex flex-col justify-between rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 transition hover:border-brand-orange hover:bg-foreground/[0.04]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <ExternalLink className="h-4 w-4 text-foreground/40 group-hover:text-brand-orange transition-colors" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground group-hover:text-brand-orange transition-colors">
                  Chính sách quyền riêng tư
                </h3>
                <p className="mt-1 text-xs text-foreground/50 font-mono">/lop-control-center/privacy/</p>
                <p className="mt-3 text-xs leading-relaxed text-foreground/70">
                  Minh bạch về phạm vi quyền Google OAuth, cách lưu trữ, bảo mật và quyền xóa dữ liệu người dùng.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center text-xs font-bold text-brand-orange">
                Xem Privacy Policy &rarr;
              </span>
            </Link>

            <Link 
              href="/lop-control-center/terms/" 
              className="group flex flex-col justify-between rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 transition hover:border-brand-orange hover:bg-foreground/[0.04]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <FileText className="h-5 w-5" />
                  </div>
                  <ExternalLink className="h-4 w-4 text-foreground/40 group-hover:text-brand-orange transition-colors" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground group-hover:text-brand-orange transition-colors">
                  Điều khoản dịch vụ
                </h3>
                <p className="mt-1 text-xs text-foreground/50 font-mono">/lop-control-center/terms/</p>
                <p className="mt-3 text-xs leading-relaxed text-foreground/70">
                  Quy định sử dụng hệ thống, tính hợp lệ của tài khoản kết nối và trách nhiệm người dùng.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center text-xs font-bold text-brand-orange">
                Xem Terms of Service &rarr;
              </span>
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-10 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Thông tin liên hệ & Hỗ trợ kỹ thuật</h4>
              <p className="text-xs sm:text-sm text-foreground/70">
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
