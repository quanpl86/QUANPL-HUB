import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản trị | King Dragon Hub',
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
    <div className="admin-workspace">
      <div className="admin-sidebar-slot">
        <AdminSidebar />
      </div>
      <main className="admin-content" id="admin-main-content">
        <AdminMobileNav />
        <Suspense fallback={<AdminLoading />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
