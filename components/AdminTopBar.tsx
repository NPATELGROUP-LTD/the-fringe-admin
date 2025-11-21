'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { auth } from '@/lib/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from './ui/Button';
import { GlobalSearch } from './GlobalSearch';
import { Modal } from './ui/Modal';
import Link from 'next/link';

interface AdminTopBarProps {
  onToggleSidebar: () => void;
}

export function AdminTopBar({ onToggleSidebar }: AdminTopBarProps) {
  const router = useRouter();
  const { adminUser } = useAuth();
  const [showHelpModal, setShowHelpModal] = useState(false);

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
        <GlobalSearch />
        <Button
          onClick={() => setShowHelpModal(true)}
          variant="ghost"
          size="sm"
          className="text-primary hover:bg-primary hover:text-secondary"
          aria-label="Help"
        >
          ❓ Help
        </Button>
        <div className="text-primary text-sm md:text-base">
          <span>
            Welcome, {adminUser?.email || 'Admin User'} ({adminUser?.role || 'Unknown'})
          </span>
        </div>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>

      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Quick Help"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/help/getting-started"
              onClick={() => setShowHelpModal(false)}
              className="block p-4 border border-theme rounded-lg hover:bg-primary hover:text-secondary transition-colors"
            >
              <div className="text-lg font-semibold mb-2">🚀 Getting Started</div>
              <p className="text-sm">Set up your admin panel and get started quickly.</p>
            </Link>

            <Link
              href="/admin/help/user-guide"
              onClick={() => setShowHelpModal(false)}
              className="block p-4 border border-theme rounded-lg hover:bg-primary hover:text-secondary transition-colors"
            >
              <div className="text-lg font-semibold mb-2">📖 User Guide</div>
              <p className="text-sm">Comprehensive guide to all features.</p>
            </Link>

            <Link
              href="/admin/help/faq"
              onClick={() => setShowHelpModal(false)}
              className="block p-4 border border-theme rounded-lg hover:bg-primary hover:text-secondary transition-colors"
            >
              <div className="text-lg font-semibold mb-2">❓ FAQ</div>
              <p className="text-sm">Answers to common questions.</p>
            </Link>

            <Link
              href="/admin/help/shortcuts"
              onClick={() => setShowHelpModal(false)}
              className="block p-4 border border-theme rounded-lg hover:bg-primary hover:text-secondary transition-colors"
            >
              <div className="text-lg font-semibold mb-2">⌨️ Shortcuts</div>
              <p className="text-sm">Keyboard shortcuts to boost productivity.</p>
            </Link>
          </div>

          <div className="border-t border-theme pt-4">
            <h3 className="font-semibold mb-2">Need More Help?</h3>
            <p className="text-sm text-secondary mb-3">
              Contact our support team for technical assistance.
            </p>
            <a
              href="mailto:support@thefringe.com"
              className="inline-block bg-primary text-secondary px-4 py-2 rounded hover:bg-opacity-90 transition-colors"
            >
              Email Support
            </a>
          </div>
        </div>
      </Modal>
    </header>
  );
}