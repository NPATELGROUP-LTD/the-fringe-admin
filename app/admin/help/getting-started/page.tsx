'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function GettingStartedPage() {
  const steps = [
    {
      step: 1,
      title: 'Set Up Your Business Information',
      description: 'Configure your business details, contact information, and branding.',
      href: '/admin/content/business-info',
      action: 'Go to Business Info'
    },
    {
      step: 2,
      title: 'Create Your First Service',
      description: 'Add services that your business offers to customers.',
      href: '/admin/content/services',
      action: 'Add Services'
    },
    {
      step: 3,
      title: 'Set Up Email Marketing',
      description: 'Configure SMTP settings and create email templates for campaigns.',
      href: '/admin/email',
      action: 'Configure Email'
    },
    {
      step: 4,
      title: 'Customize Your Site Settings',
      description: 'Adjust theme, branding, and general site preferences.',
      href: '/admin/settings',
      action: 'Site Settings'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/help" className="text-primary hover:underline">
          ← Back to Help
        </Link>
        <h1 className="text-3xl font-bold text-primary mt-4">Getting Started</h1>
        <p className="text-secondary mt-2">
          Follow these steps to set up your admin panel and start managing your business.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.step} className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-secondary rounded-full flex items-center justify-center font-bold">
                {step.step}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-secondary mb-4">
                  {step.description}
                </p>
                <Link href={step.href}>
                  <Button variant="outline">
                    {step.action}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Next Steps</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-primary">Explore Analytics</h3>
            <p className="text-secondary text-sm mb-2">
              Monitor your business performance with detailed analytics and statistics.
            </p>
            <Link href="/admin/analytics">
              <Button variant="outline" size="sm">View Analytics</Button>
            </Link>
          </div>
          <div>
            <h3 className="font-medium text-primary">Engage with Customers</h3>
            <p className="text-secondary text-sm mb-2">
              Manage contacts, send newsletters, and collect testimonials.
            </p>
            <Link href="/admin/engagement">
              <Button variant="outline" size="sm">Go to Engagement</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}