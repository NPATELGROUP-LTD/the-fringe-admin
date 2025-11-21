import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/email/campaigns/[id] - Get single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return createErrorResponse('Campaign not found', HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/email/campaigns/[id] - Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if campaign exists
    const { data: existingCampaign, error: checkError } = await supabaseAdmin
      .from('email_campaigns')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Campaign not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    const { data, error } = await supabaseAdmin
      .from('email_campaigns')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Campaign updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/email/campaigns/[id] - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if campaign exists
    const { data: existingCampaign, error: checkError } = await supabaseAdmin
      .from('email_campaigns')
      .select('id, status')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Campaign not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Don't allow deletion of sent campaigns
    if (existingCampaign.status === 'sent' || existingCampaign.status === 'sending') {
      return createErrorResponse('Cannot delete a campaign that has been sent or is currently sending', HTTP_STATUS.BAD_REQUEST);
    }

    // Delete the campaign (this will cascade to related sends and analytics)
    const { error } = await supabaseAdmin
      .from('email_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createSuccessResponse(null, 'Campaign deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}