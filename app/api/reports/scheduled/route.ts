import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';
import { exportNewsletterToCSV, exportContactsToCSV } from '@/utils/export';

// Types for scheduled reports
interface ScheduledReportRequest {
  type: 'newsletter' | 'contacts' | 'combined';
  format: 'csv' | 'xls';
  filters?: {
    status?: string;
    isRead?: boolean;
    dateFrom?: string;
    dateTo?: string;
  };
  email?: string; // Email to send report to
}

// POST /api/reports/scheduled - Generate and optionally email scheduled reports
export async function POST(request: NextRequest) {
  try {
    const body: ScheduledReportRequest = await request.json();

    const { type, format, filters, email } = body;

    let reportData: string = '';
    let filename: string = '';

    if (type === 'newsletter') {
      // Get newsletter data
      let query = supabaseAdmin
        .from('newsletter_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      reportData = exportNewsletterToCSV(data || [], filters);
      filename = `newsletter_report_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'contacts') {
      // Get contacts data
      let query = supabaseAdmin
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      reportData = exportContactsToCSV(data || [], filters);
      filename = `contacts_report_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'combined') {
      // Generate combined report
      const [newsletterData, contactsData] = await Promise.all([
        supabaseAdmin
          .from('newsletter_subscriptions')
          .select('*')
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('contact_submissions')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (newsletterData.error) throw newsletterData.error;
      if (contactsData.error) throw contactsData.error;

      const newsletterCSV = exportNewsletterToCSV(newsletterData.data || [], filters);
      const contactsCSV = exportContactsToCSV(contactsData.data || [], filters);

      // Combine into a single report
      reportData = `NEWSLETTER SUBSCRIBERS\n\n${newsletterCSV}\n\n\nCONTACT SUBMISSIONS\n\n${contactsCSV}`;
      filename = `combined_report_${new Date().toISOString().split('T')[0]}.csv`;
    }

    // TODO: If email is provided, send the report via email
    // For now, just return the report data
    // In a real implementation, you would integrate with an email service

    return createSuccessResponse({
      message: 'Report generated successfully',
      filename,
      data: reportData,
      size: reportData.length,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}