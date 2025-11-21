import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/business-info/[id] - Get single business info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('business_info')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return createErrorResponse('Business info not found', HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/business-info/[id] - Update business info
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate type if provided
    if (body.type) {
      const validTypes = ['text', 'email', 'phone', 'address', 'hours', 'social'];
      if (!validTypes.includes(body.type)) {
        return createErrorResponse(
          `Invalid type. Must be one of: ${validTypes.join(', ')}`,
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    // Check if business info exists
    const { data: existingBusinessInfo, error: checkError } = await supabaseAdmin
      .from('business_info')
      .select('id, key')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Business info not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Check if key is being changed and if it conflicts
    if (body.key && body.key !== existingBusinessInfo.key) {
      const { data: conflicting, error: conflictError } = await supabaseAdmin
        .from('business_info')
        .select('id')
        .eq('key', body.key)
        .neq('id', id)
        .single();

      if (conflicting) {
        return createErrorResponse(
          'Business info with this key already exists',
          HTTP_STATUS.CONFLICT
        );
      }
    }

    // Update the business info
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('business_info')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Business info updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/business-info/[id] - Delete business info
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if business info exists
    const { data: existingBusinessInfo, error: checkError } = await supabaseAdmin
      .from('business_info')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Business info not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Delete the business info
    const { error } = await supabaseAdmin
      .from('business_info')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createSuccessResponse(null, 'Business info deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}