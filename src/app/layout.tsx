import type { Metadata } from "next";
import { Be_Vietnam_Pro, Space_Grotesk, Inter } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kingdragonhub.com'),
  title: {
    default: 'KING DRAGON HUB | Tri thức thực chiến về AI, STEM và EdTech',
    template: '%s | KING DRAGON HUB'
  },
  description: 'Nghiên cứu, công cụ và kinh nghiệm thực hành về AI, STEM, Robotics và Công nghệ Giáo dục.',
  keywords: [
    'Giáo dục STEM', 'Trí tuệ nhân tạo (AI) trong giáo dục', 'Phương pháp giảng dạy STEM',
    'Triển khai khóa học', 'Thiết kế giáo án STEM', 'Tư duy máy tính (Computational Thinking)',
    'Robotics', 'Nền tảng công nghệ giáo dục', 'SEO Giáo dục', 'GEO (Generative Engine Optimization)',
    'AIO (AI Optimization)', 'KING DRAGON HUB'
  ],
  authors: [{ name: 'KING DRAGON' }],
  creator: 'KING DRAGON',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://kingdragonhub.com',
    title: 'KING DRAGON HUB',
    description: 'Tri thức thực chiến về AI, STEM và Công nghệ Giáo dục.',
    siteName: 'KING DRAGON HUB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KING DRAGON HUB',
    description: 'Tri thức thực chiến về AI, STEM và Công nghệ Giáo dục.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { FloatingMascot } from "@/components/ui/FloatingMascot";
import { Toaster } from "sonner";

import { JsonLd } from "@/components/seo/JsonLd";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'KING DRAGON HUB',
    url: 'https://kingdragonhub.com',
    logo: 'https://kingdragonhub.com/icon.png',
    description: 'Tri thức thực chiến về AI, STEM và Công nghệ Giáo dục.',
    sameAs: [
      'https://github.com/quanpl86'
    ]
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KING DRAGON HUB',
    url: 'https://kingdragonhub.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://kingdragonhub.com/blog?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${spaceGrotesk.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans transition-colors duration-300">
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <ThemeProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <FloatingMascot />
          <Toaster richColors position="top-right" theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  );
}
