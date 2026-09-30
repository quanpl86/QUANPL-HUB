'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const DesignStudio = dynamic(
  () => import('@/components/utility/design-studio/DesignStudio').then((mod) => mod.DesignStudio),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm font-semibold tracking-wide">Đang khởi tạo Design Studio & Canvas Engine...</p>
        <p className="text-xs text-slate-500 mt-1">Nạp các mô-đun Fabric.js, AI và bộ lọc màu</p>
      </div>
    ),
  }
);

export default function DesignStudioPage() {
  return <DesignStudio />;
}
