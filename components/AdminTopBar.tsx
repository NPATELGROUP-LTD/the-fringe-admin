'use client';

interface AdminTopBarProps {
  onToggleSidebar: () => void;
}

export function AdminTopBar({ onToggleSidebar }: AdminTopBarProps) {
  return (
    <header className="bg-secondary border-b border-theme px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="p-3 text-primary hover:bg-primary transition-colors mr-4 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-primary">The Fringe Admin</h1>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <div className="text-primary text-sm md:text-base">
          <span>Welcome, Admin User</span>
        </div>
        <button className="px-4 py-2 bg-primary text-secondary hover:bg-secondary hover:text-primary border border-theme transition-colors min-h-[44px] flex items-center justify-center">
          Logout
        </button>
      </div>
    </header>
  );
}