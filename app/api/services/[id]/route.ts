import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/services/[id] - Get single service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('services')
      .select(`
        *,
        service_categories (
          id,
          name,
          slug
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return createErrorResponse('Service not found', HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/services/[id] - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if service exists
    const { data: existingService, error: checkError } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Service not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // If slug is being updated, check uniqueness
    if (body.slug) {
      const { data: existingSlug, error: slugError } = await supabaseAdmin
        .from('services')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', id)
        .single();

      if (slugError && slugError.code !== 'PGRST116') {
        throw slugError;
      }

      if (existingSlug) {
        return createErrorResponse(
          'Service slug must be unique',
          HTTP_STATUS.CONFLICT
        );
      }
    }

    // Update the service
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        service_categories (
          id,
          name,
          slug
        )
      `)
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Service updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/services/[id] - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if service exists
    const { data: existingService, error: checkError } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Service not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Delete the service
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createSuccessResponse(null, 'Service deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}