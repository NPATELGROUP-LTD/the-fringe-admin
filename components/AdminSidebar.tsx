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
  { name: 'Content', href: '/admin/content', icon: '📝' },
  { name: 'Engagement', href: '/admin/engagement', icon: '👥' },
  { name: 'Email', href: '/admin/email', icon: '📧' },
  { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={`bg-secondary border-r border-theme transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-theme">
        {!isCollapsed && <h2 className="text-lg font-semibold text-primary">Admin Panel</h2>}
        <button
          onClick={onToggle}
          className="p-2 text-primary hover:bg-primary transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center p-2 rounded transition-colors ${
                  pathname === item.href
                    ? 'bg-primary text-secondary'
                    : 'text-primary hover:bg-primary hover:text-secondary'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}