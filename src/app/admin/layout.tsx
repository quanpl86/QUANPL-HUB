import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Command Center',
  robots: {
    index: false,
    follow: false,
  },
};

import React, { Suspense } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import AdminLoading from './loading';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-5rem)] max-w-[1600px] mx-auto w-full overflow-hidden">
      <div className="flex-shrink-0">
        <AdminSidebar />
      </div>
      <main className="flex-grow py-4 px-4 lg:px-8 overflow-y-auto">
        <AdminMobileNav />
        <Suspense fallback={<AdminLoading />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
