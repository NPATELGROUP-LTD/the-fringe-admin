'use client';

interface AdminTopBarProps {
  onToggleSidebar: () => void;
}

export function AdminTopBar({ onToggleSidebar }: AdminTopBarProps) {
  return (
    <header className="bg-secondary border-b border-theme px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-primary hover:bg-primary transition-colors mr-4"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="text-xl font-semibold text-primary">The Fringe Admin</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-primary">
          <span>Welcome, Admin User</span>
        </div>
        <button className="px-4 py-2 bg-primary text-secondary hover:bg-secondary hover:text-primary border border-theme transition-colors">
          Logout
        </button>
      </div>
    </header>
  );
}