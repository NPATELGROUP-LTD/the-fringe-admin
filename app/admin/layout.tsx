'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useGlobalKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';

// Lazy load components
const AdminSidebar = dynamic(() => import('@/components/AdminSidebar').then(mod => ({ default: mod.AdminSidebar })), {
  loading: () => <div className="w-64 bg-secondary animate-pulse" />
});
const AdminTopBar = dynamic(() => import('@/components/AdminTopBar').then(mod => ({ default: mod.AdminTopBar })), {
  loading: () => <div className="h-16 bg-primary animate-pulse" />
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Enable global keyboard shortcuts
  useGlobalKeyboardShortcuts();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-primary">
      {/* Sidebar */}
      <div className={`${
        isMobile
          ? `fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`
          : 'relative'
      }`}>
        <Suspense fallback={<div className="w-64 bg-secondary animate-pulse" />}>
          <AdminSidebar
            isCollapsed={!isMobile && !isSidebarOpen}
            onToggle={toggleSidebar}
            isMobile={isMobile}
          />
        </Suspense>
      </div>

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'ml-0' : ''}`}>
        <Suspense fallback={<div className="h-16 bg-primary animate-pulse" />}>
          <AdminTopBar onToggleSidebar={toggleSidebar} />
        </Suspense>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}