import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/services/export - Export services to CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const categoryId = searchParams.get('category_id');
    const isActive = searchParams.get('is_active');

    if (format !== 'csv') {
      return createErrorResponse('Only CSV format is supported', HTTP_STATUS.BAD_REQUEST);
    }

    // Build query
    let query = supabaseAdmin
      .from('services')
      .select(`
        *,
        service_categories (
          name
        )
      `);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: services, error } = await query;

    if (error) throw error;

    if (!services || services.length === 0) {
      return createErrorResponse('No services found to export', HTTP_STATUS.NOT_FOUND);
    }

    // Convert to CSV
    const headers = ['Title', 'Slug', 'Description', 'Price', 'Duration', 'Category', 'Active', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...services.map(service => [
        `"${service.title.replace(/"/g, '""')}"`,
        `"${service.slug.replace(/"/g, '""')}"`,
        `"${(service.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        service.price,
        service.duration,
        `"${(service.service_categories?.name || '').replace(/"/g, '""')}"`,
        service.is_active ? 'Yes' : 'No',
        new Date(service.created_at).toLocaleString(),
      ].join(','))
    ].join('\n');

    // Return CSV file
    const response = new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="services_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

    return response;

  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}