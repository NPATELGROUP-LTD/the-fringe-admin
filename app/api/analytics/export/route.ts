import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createSuccessResponse, handleApiError } from '@/lib/api/utils';

interface ExportRequest {
  startDate: string;
  endDate: string;
  format: 'csv' | 'json';
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { startDate, endDate, format } = body;

    // Validate inputs
    if (!['csv', 'json'].includes(format)) {
      return createSuccessResponse({ error: 'Invalid format. Must be csv or json' }, 'Invalid format specified', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return createSuccessResponse({ error: 'Invalid date range' }, 'Invalid date range provided', 400);
    }

    // Fetch all analytics data
    const [
      contacts,
      newsletter,
      reviews,
      testimonials,
      courses,
      services,
      offers,
      campaigns
    ] = await Promise.all([
      supabaseAdmin.from('contact_submissions')
        .select('name, email, subject, message, is_read, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false }),

      supabaseAdmin.from('newsletter_subscriptions')
        .select('email, first_name, last_name, status, subscribed_at')
        .gte('subscribed_at', start.toISOString())
        .lte('subscribed_at', end.toISOString())
        .order('subscribed_at', { ascending: false }),

      supabaseAdmin.from('reviews')
        .select('name, email, title, content, rating, is_approved, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false }),

      supabaseAdmin.from('testimonials')
        .select('name, email, company, position, content, rating, is_featured, is_approved, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false }),

      supabaseAdmin.from('courses')
        .select('title, slug, description, price, duration, is_active, created_at'),

      supabaseAdmin.from('services')
        .select('title, slug, description, price, duration, is_active, created_at'),

      supabaseAdmin.from('offers')
        .select('title, description, discount_type, discount_value, valid_from, valid_until, usage_count, is_active, created_at'),

      supabaseAdmin.from('email_campaigns')
        .select('name, subject, status, total_recipients, sent_count, opened_count, clicked_count, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
    ]);

    // Prepare export data
    const exportData = {
      summary: {
        dateRange: { startDate, endDate },
        totals: {
          contacts: contacts.data?.length || 0,
          newsletter: newsletter.data?.length || 0,
          reviews: reviews.data?.length || 0,
          testimonials: testimonials.data?.length || 0,
          courses: courses.data?.length || 0,
          services: services.data?.length || 0,
          offers: offers.data?.length || 0,
          campaigns: campaigns.data?.length || 0
        }
      },
      contacts: contacts.data || [],
      newsletter: newsletter.data || [],
      reviews: reviews.data || [],
      testimonials: testimonials.data || [],
      courses: courses.data || [],
      services: services.data || [],
      offers: offers.data || [],
      campaigns: campaigns.data || []
    };

    let content: string;
    let contentType: string;
    let filename: string;

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2);
      contentType = 'application/json';
      filename = `analytics-report-${startDate}-to-${endDate}.json`;
    } else {
      // Create CSV with multiple sheets (as separate CSV sections)
      const csvSections = [
        'SUMMARY',
        convertToCSV([exportData.summary.totals]),
        '',
        'CONTACTS',
        convertToCSV(exportData.contacts),
        '',
        'NEWSLETTER',
        convertToCSV(exportData.newsletter),
        '',
        'REVIEWS',
        convertToCSV(exportData.reviews),
        '',
        'TESTIMONIALS',
        convertToCSV(exportData.testimonials),
        '',
        'COURSES',
        convertToCSV(exportData.courses),
        '',
        'SERVICES',
        convertToCSV(exportData.services),
        '',
        'OFFERS',
        convertToCSV(exportData.offers),
        '',
        'CAMPAIGNS',
        convertToCSV(exportData.campaigns)
      ];

      content = csvSections.join('\n');
      contentType = 'text/csv';
      filename = `analytics-report-${startDate}-to-${endDate}.csv`;
    }

    // Return file as response
    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    return handleApiError(error);
  }
}