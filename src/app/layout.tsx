import type { Metadata } from "next";
import { Be_Vietnam_Pro, Space_Grotesk } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: 'QUAN-PL BLOG-HUB | Đỉnh Cao Trí Tuệ & Công Nghệ',
    template: '%s | QUAN-PL BLOG-HUB'
  },
  description: 'Nền tảng chia sẻ kiến thức chuyên sâu về Lập trình, AI, Robotics và Phát triển bản thân. Matrix thông tin dành cho những nhà khai phá.',
  keywords: ['quanpl', 'coding', 'robotics', 'ai', 'technology', 'blog hub'],
  authors: [{ name: 'QuanPL' }],
  creator: 'QuanPL',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://quanpl-hub.com',
    title: 'QUAN-PL BLOG-HUB',
    description: 'Matrix thông tin dành cho những nhà khai phá.',
    siteName: 'QUAN-PL BLOG-HUB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QUAN-PL BLOG-HUB',
    description: 'Matrix thông tin dành cho những nhà khai phá.',
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
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${spaceGrotesk.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-be-vietnam transition-colors duration-300">
        <ThemeProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <Toaster richColors position="top-right" theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  );
}
