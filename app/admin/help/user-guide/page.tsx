'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export default function UserGuidePage() {
  const sections = [
    {
      title: 'Dashboard Overview',
      content: 'The dashboard provides a quick overview of your business metrics, recent activity, and key performance indicators.',
      subsections: [
        'Analytics charts showing trends over time',
        'Quick stats for contacts, services, and campaigns',
        'Recent activity feed',
        'Shortcut buttons to common actions'
      ]
    },
    {
      title: 'Content Management',
      content: 'Manage all your business content including services, courses, FAQs, and business information.',
      subsections: [
        'Services: Add, edit, and organize your service offerings',
        'Courses: Create and manage educational content',
        'Business Info: Update company details and contact information',
        'Categories: Organize content with custom categories'
      ]
    },
    {
      title: 'Email Marketing',
      content: 'Create and manage email campaigns, templates, and SMTP settings.',
      subsections: [
        'Campaigns: Design and send targeted email campaigns',
        'Templates: Create reusable email templates',
        'SMTP Settings: Configure email delivery',
        'Analytics: Track campaign performance'
      ]
    },
    {
      title: 'Customer Engagement',
      content: 'Interact with customers through contacts, newsletters, and testimonials.',
      subsections: [
        'Contacts: Manage your customer database',
        'Newsletter: Send bulk emails and manage subscriptions',
        'Reviews: Collect and display customer testimonials',
        'Bulk Operations: Import/export data efficiently'
      ]
    },
    {
      title: 'Analytics & Statistics',
      content: 'Monitor your business performance with detailed analytics.',
      subsections: [
        'Real-time analytics dashboard',
        'Custom date range reporting',
        'Export capabilities for external analysis',
        'Performance metrics and KPIs'
      ]
    },
    {
      title: 'Settings & Configuration',
      content: 'Customize the admin panel and site settings.',
      subsections: [
        'Site Settings: Global configuration options',
        'Theme customization',
        'User preferences',
        'Security settings'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/help" className="text-primary hover:underline">
          ← Back to Help
        </Link>
        <h1 className="text-3xl font-bold text-primary mt-4">User Guide</h1>
        <p className="text-secondary mt-2">
          Comprehensive guide to all features and functionality of the admin panel.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section, index) => (
          <Card key={index} className="p-6">
            <h2 className="text-2xl font-semibold text-primary mb-4">
              {section.title}
            </h2>
            <p className="text-secondary mb-4">
              {section.content}
            </p>
            <ul className="list-disc list-inside space-y-2 text-secondary">
              {section.subsections.map((subsection, subIndex) => (
                <li key={subIndex}>{subsection}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Quick Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-primary">Keyboard Shortcuts</h3>
            <p className="text-secondary text-sm">
              Use Ctrl+K (Cmd+K on Mac) to open global search anywhere in the admin panel.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-primary">Bulk Operations</h3>
            <p className="text-secondary text-sm">
              Select multiple items in tables to perform bulk actions like delete or export.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-primary">Auto-save</h3>
            <p className="text-secondary text-sm">
              Forms auto-save drafts to prevent data loss.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-primary">Search & Filter</h3>
            <p className="text-secondary text-sm">
              Use search bars and filters to quickly find specific content.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}