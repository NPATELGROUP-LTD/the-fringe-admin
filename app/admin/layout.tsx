'use client';

import { useState } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminTopBar } from '@/components/AdminTopBar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div className="flex h-screen bg-primary">
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <AdminTopBar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}