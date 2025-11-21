'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  name: string;
  href: string;
  icon: string;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
  { name: 'Statistics', href: '/admin/statistics', icon: '📊' },
  { name: 'Content', href: '/admin/content', icon: '📝' },
  { name: 'Engagement', href: '/admin/engagement', icon: '👥' },
  { name: 'Email', href: '/admin/email', icon: '📧' },
  { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
  { name: 'Help', href: '/admin/help', icon: '❓' },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function AdminSidebar({ isCollapsed, onToggle, isMobile = false }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={`bg-secondary border-r border-theme transition-all duration-300 ${
      isMobile ? 'w-64' : (isCollapsed ? 'w-16' : 'w-64')
    }`} data-tour="sidebar">
      <div className="flex items-center justify-between p-4 border-b border-theme">
        <h2 className={`text-lg font-semibold text-primary ${isMobile || !isCollapsed ? '' : 'hidden'}`}>Admin Panel</h2>
        {!isMobile && (
          <button
            onClick={onToggle}
            className="p-2 text-primary hover:bg-primary transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        )}
        {isMobile && (
          <button
            onClick={onToggle}
            className="p-2 text-primary hover:bg-primary transition-colors"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        )}
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center p-3 rounded transition-colors min-h-[44px] ${
                  pathname === item.href
                    ? 'bg-primary text-secondary'
                    : 'text-primary hover:bg-primary hover:text-secondary'
                } ${!isMobile && isCollapsed ? 'justify-center' : ''}`}
                onClick={isMobile ? onToggle : undefined}
              >
                <span className="text-xl">{item.icon}</span>
                {(!isMobile || !isCollapsed) && <span className="ml-3">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}