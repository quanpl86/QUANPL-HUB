import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ['@neplex/vectorizer'],
  async headers() {
    return [
      {
        source: '/utility-hub/background-remover',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
      {
        source: '/vendor/background-removal/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // SEO hygiene: preserve equity for legacy article URLs that have a clear canonical replacement.
      {
        source: '/posts/notebooklm-xay-dung-bo-nao-thu-cho-giao-duc-stem-po4ow',
        destination: '/posts/notebooklm-xay-dung-bo-nao-thu-hai-cho-giao-duc-stem-po4ow',
        permanent: true,
      },
      {
        source: '/posts/toi-da-bien-dragonmind-thanh-bai-rac-tri-thuc-nhu-the-nao-bai-hoc-sau-10-tuan-xay-second-brain-ikkk9',
        destination: '/posts/second-brain-stem-vai-tro-khong-the-thay-the-cua-con-nguoi-trong-kiem-chung-tri-thuc-kii9v',
        permanent: true,
      },
      // 1. Hub chung LOP
      {
        source: '/lop',
        destination: '/lop-control-center/',
        permanent: false,
      },
      // 2. LOP Control Center & Op Center
      {
        source: '/lop/control',
        destination: 'https://script.google.com/macros/s/AKfycbxyVkR5zsCbNALt62-E_t9lRMybA1p8PLdAvReuQrt2SA76vtXpN6Qd4X-awbQIZh6c/exec',
        permanent: false,
      },
      {
        source: '/lop/admin',
        destination: 'https://script.google.com/macros/s/AKfycbxyVkR5zsCbNALt62-E_t9lRMybA1p8PLdAvReuQrt2SA76vtXpN6Qd4X-awbQIZh6c/exec',
        permanent: false,
      },
      {
        source: '/lop-app',
        destination: 'https://script.google.com/macros/s/AKfycbxyVkR5zsCbNALt62-E_t9lRMybA1p8PLdAvReuQrt2SA76vtXpN6Qd4X-awbQIZh6c/exec',
        permanent: false,
      },
      // 3. Teacher Portal
      {
        source: '/lop/teacher',
        destination: 'https://script.google.com/macros/s/AKfycbxFI1NAkMo-FGI4q3uoA7nfOedDaRLOG2-xvdbmIv-a19mpMVm6kHAwEgEJ-BohtTBu/exec',
        permanent: false,
      },
      {
        source: '/teacher',
        destination: 'https://script.google.com/macros/s/AKfycbxFI1NAkMo-FGI4q3uoA7nfOedDaRLOG2-xvdbmIv-a19mpMVm6kHAwEgEJ-BohtTBu/exec',
        permanent: false,
      },
      // 4. Student Portal
      {
        source: '/lop/student',
        destination: 'https://script.google.com/macros/s/AKfycbxY4ioAwO0bhJY8QIzd9PPA9qSQPPBMTuYKtx9GWGZXW_rdQUnRcPBhCVh1H5NdBzy99g/exec',
        permanent: false,
      },
      {
        source: '/student',
        destination: 'https://script.google.com/macros/s/AKfycbxY4ioAwO0bhJY8QIzd9PPA9qSQPPBMTuYKtx9GWGZXW_rdQUnRcPBhCVh1H5NdBzy99g/exec',
        permanent: false,
      },
    ];
  },
  images: {
    qualities: [75, 95, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jlffnasmgzfligxdrfiy.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
