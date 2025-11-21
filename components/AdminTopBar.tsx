'use client';

import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from './ui/Button';

interface AdminTopBarProps {
  onToggleSidebar: () => void;
}

export function AdminTopBar({ onToggleSidebar }: AdminTopBarProps) {
  const router = useRouter();
  const { adminUser } = useAuth();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/admin/login');
  };
  return (
    <header className="bg-secondary border-b border-theme px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
      <div className="flex items-center">
        <Button
          onClick={onToggleSidebar}
          variant="ghost"
          size="sm"
          className="mr-4"
          aria-label="Toggle sidebar"
        >
          ☰
        </Button>
        <h1 className="text-lg md:text-xl font-semibold text-primary">The Fringe Admin</h1>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <div className="text-primary text-sm md:text-base">
          <span>
            Welcome, {adminUser?.email || 'Admin User'} ({adminUser?.role || 'Unknown'})
          </span>
        </div>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
    </header>
  );
}