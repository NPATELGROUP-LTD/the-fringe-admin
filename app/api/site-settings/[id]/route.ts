import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/site-settings/[id] - Get single site setting
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return createErrorResponse('Site setting not found', HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/site-settings/[id] - Update site setting
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate type matches value if provided
    if (body.type && body.value !== undefined) {
      const { type, value } = body;
      if (type === 'number' && typeof value !== 'number') {
        return createErrorResponse('Value must be a number for type "number"', HTTP_STATUS.BAD_REQUEST);
      }
      if (type === 'boolean' && typeof value !== 'boolean') {
        return createErrorResponse('Value must be a boolean for type "boolean"', HTTP_STATUS.BAD_REQUEST);
      }
      if (type === 'string' && typeof value !== 'string') {
        return createErrorResponse('Value must be a string for type "string"', HTTP_STATUS.BAD_REQUEST);
      }
      if (type === 'json' && (typeof value !== 'object' || value === null)) {
        return createErrorResponse('Value must be an object for type "json"', HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Check if setting exists
    const { data: existingSetting, error: checkError } = await supabaseAdmin
      .from('site_settings')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Site setting not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Check if key is being changed and if it conflicts
    if (body.key) {
      const { data: conflictingSetting } = await supabaseAdmin
        .from('site_settings')
        .select('id')
        .eq('key', body.key)
        .neq('id', id)
        .single();

      if (conflictingSetting) {
        return createErrorResponse('Setting key already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // Update the site setting
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Site setting updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/site-settings/[id] - Delete site setting
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if setting exists
    const { data: existingSetting, error: checkError } = await supabaseAdmin
      .from('site_settings')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Site setting not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Delete the site setting
    const { error } = await supabaseAdmin
      .from('site_settings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createSuccessResponse(null, 'Site setting deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}