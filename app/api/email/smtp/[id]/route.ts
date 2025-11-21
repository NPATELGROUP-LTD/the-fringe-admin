import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/email/smtp/[id] - Get single SMTP settings
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('email_smtp_settings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return createErrorResponse('SMTP settings not found', HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/email/smtp/[id] - Update SMTP settings
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if settings exist
    const { data: existingSettings, error: checkError } = await supabaseAdmin
      .from('email_smtp_settings')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('SMTP settings not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // If activating this settings, deactivate all others
    if (body.is_active === true) {
      await supabaseAdmin
        .from('email_smtp_settings')
        .update({ is_active: false })
        .neq('id', id);
    }

    const { data, error } = await supabaseAdmin
      .from('email_smtp_settings')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'SMTP settings updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/email/smtp/[id] - Delete SMTP settings
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if settings exist
    const { data: existingSettings, error: checkError } = await supabaseAdmin
      .from('email_smtp_settings')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('SMTP settings not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Delete the settings
    const { error } = await supabaseAdmin
      .from('email_smtp_settings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createSuccessResponse(null, 'SMTP settings deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}