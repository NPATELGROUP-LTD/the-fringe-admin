import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/newsletter/templates/[id] - Get single email template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return createErrorResponse('Email template not found', HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/newsletter/templates/[id] - Update email template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if template exists
    const { data: existingTemplate, error: checkError } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Email template not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // If name is being changed, check for duplicates
    if (body.name) {
      const { data: duplicateTemplate } = await supabaseAdmin
        .from('email_templates')
        .select('id')
        .eq('name', body.name)
        .neq('id', id)
        .single();

      if (duplicateTemplate) {
        return createErrorResponse(
          'Template name already exists',
          HTTP_STATUS.CONFLICT
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Email template updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/newsletter/templates/[id] - Delete email template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if template exists
    const { data: existingTemplate, error: checkError } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Email template not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Delete the template
    const { error } = await supabaseAdmin
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createSuccessResponse(null, 'Email template deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}