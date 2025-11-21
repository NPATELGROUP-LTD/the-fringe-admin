import Link from 'next/link';
import { Card } from '@/components/ui/Card';

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

export default function HelpPage() {
  const helpSections = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of using the admin panel',
      href: '/admin/help/getting-started',
      icon: '🚀'
    },
    {
      title: 'User Guide',
      description: 'Comprehensive guide to all features',
      href: '/admin/help/user-guide',
      icon: '📖'
    },
    {
      title: 'FAQ',
      description: 'Frequently asked questions',
      href: '/admin/help/faq',
      icon: '❓'
    },
    {
      title: 'Keyboard Shortcuts',
      description: 'Time-saving keyboard shortcuts',
      href: '/admin/help/shortcuts',
      icon: '⌨️'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Help & Documentation</h1>
        <p className="text-secondary mt-2">
          Find guides, tutorials, and answers to common questions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {helpSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">{section.icon}</div>
                <h3 className="text-xl font-semibold text-primary mb-2">
                  {section.title}
                </h3>
                <p className="text-secondary text-sm">
                  {section.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Need More Help?</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-primary">Contact Support</h3>
            <p className="text-secondary text-sm">
              Email us at support@thefringe.com for technical assistance.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-primary">Live Chat</h3>
            <p className="text-secondary text-sm">
              Available during business hours for immediate help.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-primary">Community Forum</h3>
            <p className="text-secondary text-sm">
              Join our community to ask questions and share knowledge.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}