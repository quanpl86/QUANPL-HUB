import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import { ArrowUpRight, Code, MessageCircle, PlayCircle, UserCircle } from 'lucide-react';
import { verifiedPublicSocialLinks } from '@/lib/content/public-content';

const columns = [
  { title: 'Khám phá', links: [['AI', '/blog?q=AI'], ['STEM', '/blog?q=STEM'], ['Robot', '/blog?q=Robotics'], ['Dạy & Học', '/blog?q=giáo dục']] },
  { title: 'Tài nguyên', links: [['Bài viết', '/blog'], ['Tiện ích', '/utility-hub'], ['Bản đồ tri thức', '/#knowledge-fields'], ['Bắt đầu tại đây', '/#start-here']] },
  { title: 'King Dragon Hub', links: [['Giới thiệu', '/about'], ['Đăng nhập', '/login'], ['RSS', '/feed.xml'], ['Trang chủ', '/']] },
];

export function Footer() {
  const networks = [
    { href: verifiedPublicSocialLinks.github, label: 'GitHub', Icon: Code },
    { href: verifiedPublicSocialLinks.facebook, label: 'Facebook', Icon: MessageCircle },
    { href: verifiedPublicSocialLinks.linkedin, label: 'LinkedIn', Icon: UserCircle },
    { href: verifiedPublicSocialLinks.youtube, label: 'YouTube', Icon: PlayCircle },
  ];

  return (
    <footer className="border-t border-foreground/10 bg-foreground/[0.025]">
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1.8fr]">
          <div className="max-w-md">
            <Link href="/" className="inline-flex" aria-label="King Dragon Hub — Trang chủ">
              <BrandLogo />
            </Link>
            <p className="mt-5 text-sm leading-7 text-foreground/60">Kiến thức thực hành về AI, STEM và công nghệ giáo dục.</p>
            <nav aria-label="Kết nối với King Dragon Hub" className="mt-5 inline-flex items-center overflow-hidden rounded-md border border-foreground/20 bg-background/60">
              {networks.map(({ href, label, Icon }, index) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${label} của King Dragon Hub`}
                  title={label}
                  className={`grid h-10 w-10 place-items-center text-foreground/75 transition hover:bg-brand-orange hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange ${index ? 'border-l border-foreground/15' : ''}`}
                >
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                </a>
              ))}
            </nav>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/40">{column.title}</h2>
                <ul className="mt-5 space-y-3">
                  {column.links.map(([label, href]) => <li key={label}><Link href={href} className="inline-flex items-center gap-1 text-sm text-foreground/65 transition hover:text-brand-orange">{label}{label === 'Tiện ích' && <ArrowUpRight size={12} />}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-foreground/10 pt-6 text-xs text-foreground/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} King Dragon Hub. Toàn bộ bản quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
