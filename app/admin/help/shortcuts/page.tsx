'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export default function ShortcutsPage() {
  const shortcuts = [
    {
      category: 'Global Shortcuts',
      items: [
        { keys: 'Ctrl+K / Cmd+K', description: 'Open global search' },
        { keys: 'Ctrl+/ / Cmd+/', description: 'Show/hide sidebar' },
        { keys: 'Ctrl+S / Cmd+S', description: 'Save current form' },
        { keys: 'Escape', description: 'Close modals or cancel actions' }
      ]
    },
    {
      category: 'Navigation',
      items: [
        { keys: 'Alt+D', description: 'Go to Dashboard' },
        { keys: 'Alt+A', description: 'Go to Analytics' },
        { keys: 'Alt+C', description: 'Go to Content' },
        { keys: 'Alt+E', description: 'Go to Engagement' },
        { keys: 'Alt+M', description: 'Go to Email' },
        { keys: 'Alt+S', description: 'Go to Settings' },
        { keys: 'Alt+H', description: 'Go to Help' }
      ]
    },
    {
      category: 'Data Tables',
      items: [
        { keys: 'Ctrl+F / Cmd+F', description: 'Focus search in table' },
        { keys: 'Ctrl+A / Cmd+A', description: 'Select all items' },
        { keys: 'Delete / Backspace', description: 'Delete selected items' },
        { keys: 'Enter', description: 'Edit selected item' },
        { keys: 'Ctrl+E / Cmd+E', description: 'Export selected items' }
      ]
    },
    {
      category: 'Forms',
      items: [
        { keys: 'Tab', description: 'Move to next field' },
        { keys: 'Shift+Tab', description: 'Move to previous field' },
        { keys: 'Ctrl+Enter / Cmd+Enter', description: 'Submit form' },
        { keys: 'Ctrl+Z / Cmd+Z', description: 'Undo last change' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/help" className="text-primary hover:underline">
          ← Back to Help
        </Link>
        <h1 className="text-3xl font-bold text-primary mt-4">Keyboard Shortcuts</h1>
        <p className="text-secondary mt-2">
          Boost your productivity with these keyboard shortcuts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shortcuts.map((category, index) => (
          <Card key={index} className="p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">
              {category.category}
            </h2>
            <div className="space-y-3">
              {category.items.map((shortcut, shortcutIndex) => (
                <div key={shortcutIndex} className="flex justify-between items-center">
                  <span className="text-secondary">{shortcut.description}</span>
                  <kbd className="bg-primary text-secondary px-2 py-1 rounded text-sm font-mono">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Tips</h2>
        <ul className="list-disc list-inside space-y-2 text-secondary">
          <li>Shortcuts work across all sections of the admin panel</li>
          <li>Mac users can use Cmd instead of Ctrl for most shortcuts</li>
          <li>Some shortcuts may be disabled if a form field is focused</li>
          <li>Press Ctrl+K anywhere to see all available shortcuts</li>
          <li>Shortcuts are customizable in your user settings</li>
        </ul>
      </Card>
    </div>
  );
}