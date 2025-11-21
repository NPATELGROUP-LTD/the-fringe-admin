'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I add a new service?',
    answer: 'Go to Content > Services, click "Add New Service", fill in the details, and save. Your service will be published immediately.'
  },
  {
    question: 'How do I send an email campaign?',
    answer: 'Navigate to Email > Campaigns, create a new campaign, select recipients, choose a template, and schedule or send immediately.'
  },
  {
    question: 'How do I view analytics?',
    answer: 'Visit the Analytics page to see detailed reports on user engagement, page views, and performance metrics.'
  },
  {
    question: 'How do I manage user contacts?',
    answer: 'Go to Engagement > Contacts to view, edit, import, or export your contact list.'
  },
  {
    question: 'How do I customize the site theme?',
    answer: 'Visit Settings to change colors, fonts, and other visual elements of your site.'
  },
  {
    question: 'How do I reset my password?',
    answer: 'Click on your profile in the top bar and select "Change Password", or use the "Forgot Password" link on the login page.'
  },
  {
    question: 'How do I export data?',
    answer: 'Most sections have an export button. Look for the download icon in tables and data views.'
  },
  {
    question: 'How do I add testimonials?',
    answer: 'Go to Engagement > Testimonials, click "Add New", and fill in the customer details and their testimonial.'
  }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/help" className="text-primary hover:underline">
          ← Back to Help
        </Link>
        <h1 className="text-3xl font-bold text-primary mt-4">Frequently Asked Questions</h1>
        <p className="text-secondary mt-2">
          Find answers to common questions about using the admin panel.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card key={index} className="p-6">
            <button
              onClick={() => toggleItem(index)}
              className="w-full text-left focus:outline-none"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary">
                  {faq.question}
                </h3>
                <span className="text-primary text-xl">
                  {openItems.has(index) ? '−' : '+'}
                </span>
              </div>
            </button>
            {openItems.has(index) && (
              <div className="mt-4 pt-4 border-t border-theme">
                <p className="text-secondary">
                  {faq.answer}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-6 text-center">
        <h2 className="text-xl font-semibold text-primary mb-4">Still Need Help?</h2>
        <p className="text-secondary mb-4">
          Can't find the answer you're looking for? Contact our support team.
        </p>
        <div className="space-x-4">
          <a
            href="mailto:support@thefringe.com"
            className="inline-block bg-primary text-secondary px-4 py-2 rounded hover:bg-opacity-90 transition-colors"
          >
            Email Support
          </a>
          <Link
            href="/admin/help/user-guide"
            className="inline-block border border-primary text-primary px-4 py-2 rounded hover:bg-primary hover:text-secondary transition-colors"
          >
            View User Guide
          </Link>
        </div>
      </Card>
    </div>
  );
}