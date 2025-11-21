import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/email/triggers/[id] - Get single email trigger
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('email_triggers')
      .select(`
        *,
        email_templates (
          id,
          name,
          subject
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return createErrorResponse('Email trigger not found', HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/email/triggers/[id] - Update email trigger
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if trigger exists
    const { data: existingTrigger, error: checkError } = await supabaseAdmin
      .from('email_triggers')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Email trigger not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // If template_id is being changed, verify it exists
    if (body.template_id) {
      const { data: template } = await supabaseAdmin
        .from('email_templates')
        .select('id')
        .eq('id', body.template_id)
        .single();

      if (!template) {
        return createErrorResponse(
          'Email template not found',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    // If name is being changed, check for duplicates
    if (body.name) {
      const { data: duplicateTrigger } = await supabaseAdmin
        .from('email_triggers')
        .select('id')
        .eq('name', body.name)
        .neq('id', id)
        .single();

      if (duplicateTrigger) {
        return createErrorResponse(
          'Trigger name already exists',
          HTTP_STATUS.CONFLICT
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from('email_triggers')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Email trigger updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/email/triggers/[id] - Delete email trigger
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if trigger exists
    const { data: existingTrigger, error: checkError } = await supabaseAdmin
      .from('email_triggers')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Email trigger not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Delete the trigger
    const { error } = await supabaseAdmin
      .from('email_triggers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createSuccessResponse(null, 'Email trigger deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}