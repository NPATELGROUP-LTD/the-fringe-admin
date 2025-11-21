import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/contacts/[id] - Get single contact submission
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('contact_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return createErrorResponse('Contact submission not found', HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/contacts/[id] - Update contact submission
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if contact submission exists
    const { data: existingContact, error: checkError } = await supabaseAdmin
      .from('contact_submissions')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Contact submission not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Handle response tracking
    const updateData: any = { ...body };

    // If adding a response, set responded_at
    if (body.response && !body.responded_at) {
      updateData.responded_at = new Date().toISOString();
    }

    // If removing response, clear responded_at
    if (body.response === null || body.response === '') {
      updateData.responded_at = null;
    }

    const { data, error } = await supabaseAdmin
      .from('contact_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Contact submission updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/contacts/[id] - Delete contact submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if contact submission exists
    const { data: existingContact, error: checkError } = await supabaseAdmin
      .from('contact_submissions')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Contact submission not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Delete the contact submission
    const { error } = await supabaseAdmin
      .from('contact_submissions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createSuccessResponse(null, 'Contact submission deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}