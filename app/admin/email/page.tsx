'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function AdminEmail() {
  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Email Management</h1>
          <p className="text-primary text-sm md:text-base">Manage newsletter subscribers, email campaigns, and templates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Newsletter Subscribers */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              📧 Newsletter Subscribers
            </h3>
            <p className="text-gray-600 text-sm">
              Manage your newsletter subscriber list, send bulk emails, and segment your audience.
            </p>
          </div>
          <div>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>• View and manage subscribers</li>
              <li>• Send bulk emails</li>
              <li>• Advanced segmentation</li>
              <li>• Import/export subscribers</li>
            </ul>
            <Link href="/admin/engagement/newsletter">
              <Button className="w-full">
                Manage Subscribers
              </Button>
            </Link>
          </div>
        </div>

        {/* Email Templates */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
           <div className="mb-4">
             <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
               📝 Email Templates
             </h3>
             <p className="text-gray-600 text-sm">
               Create and manage reusable email templates for campaigns and newsletters.
             </p>
           </div>
           <div>
             <ul className="text-sm text-gray-600 space-y-1 mb-4">
               <li>• Create custom templates</li>
               <li>• Template variables</li>
               <li>• HTML email support</li>
               <li>• Template library</li>
             </ul>
             <Link href="/admin/email/templates">
               <Button className="w-full">
                 Manage Templates
               </Button>
             </Link>
           </div>
         </div>

        {/* Email Triggers */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
           <div className="mb-4">
             <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
               ⚡ Email Triggers
             </h3>
             <p className="text-gray-600 text-sm">
               Set up automated email triggers based on user actions and events.
             </p>
           </div>
           <div>
             <ul className="text-sm text-gray-600 space-y-1 mb-4">
               <li>• Automated email triggers</li>
               <li>• Event-based sending</li>
               <li>• Conditional logic</li>
               <li>• Trigger management</li>
             </ul>
             <Link href="/admin/email/triggers">
               <Button className="w-full">
                 Manage Triggers
               </Button>
             </Link>
           </div>
         </div>

        {/* Email Settings */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
           <div className="mb-4">
             <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
               ⚙️ SMTP Settings
             </h3>
             <p className="text-gray-600 text-sm">
               Configure SMTP settings, sender information, and email preferences.
             </p>
           </div>
           <div>
             <ul className="text-sm text-gray-600 space-y-1 mb-4">
               <li>• SMTP configuration</li>
               <li>• Sender settings</li>
               <li>• Email preferences</li>
               <li>• Delivery settings</li>
             </ul>
             <Link href="/admin/email/smtp">
               <Button className="w-full">
                 Configure SMTP
               </Button>
             </Link>
           </div>
         </div>

        {/* Email Campaigns */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              📧 Email Campaigns
            </h3>
            <p className="text-gray-600 text-sm">
              Create and manage email campaigns with subscriber segmentation and performance tracking.
            </p>
          </div>
          <div>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>• Campaign creation and scheduling</li>
              <li>• Subscriber segmentation</li>
              <li>• Performance analytics</li>
              <li>• A/B testing support</li>
            </ul>
            <Link href="/admin/email/campaigns">
              <Button className="w-full">
                Manage Campaigns
              </Button>
            </Link>
          </div>
        </div>

        {/* Subscriber Analytics */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              📊 Subscriber Analytics
            </h3>
            <p className="text-gray-600 text-sm">
              Track subscriber growth, engagement metrics, and email performance.
            </p>
          </div>
          <div>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>• Growth metrics</li>
              <li>• Engagement rates</li>
              <li>• Unsubscribe tracking</li>
              <li>• Geographic data</li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </div>
        </div>

        {/* Compliance Tools */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              🛡️ Compliance Tools
            </h3>
            <p className="text-gray-600 text-sm">
              Ensure compliance with email regulations like GDPR, CAN-SPAM, and CASL.
            </p>
          </div>
          <div>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>• Consent management</li>
              <li>• Unsubscribe handling</li>
              <li>• Data export tools</li>
              <li>• Compliance reporting</li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}