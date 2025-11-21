import { NextRequest } from 'next/server';
import {
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';
import { exportContactsToCSV, exportContactsToXLS } from '@/utils/export';

// GET /api/contacts/export - Export contact submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv or xls
    const isRead = searchParams.get('is_read');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Build query to get all contacts (no pagination for export)
    let query = supabaseAdmin
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (isRead !== null) {
      query = query.eq('is_read', isRead === 'true');
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    const contacts = data || [];

    // Generate export content
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'xls') {
      content = exportContactsToXLS(contacts, { isRead: isRead === 'true', dateFrom, dateTo });
      filename = `contact_submissions_${new Date().toISOString().split('T')[0]}.xls`;
      mimeType = 'application/vnd.ms-excel';
    } else {
      content = exportContactsToCSV(contacts, { isRead: isRead === 'true', dateFrom, dateTo });
      filename = `contact_submissions_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    }

    // Return file response
    return new Response(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
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