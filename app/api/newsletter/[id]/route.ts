import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/newsletter/[id] - Get single newsletter subscription
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return createErrorResponse('Newsletter subscription not found', HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/newsletter/[id] - Update newsletter subscription
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if subscription exists
    const { data: existingSubscription, error: checkError } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .select('id, status')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Newsletter subscription not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Handle status changes
    const updateData: any = { ...body };

    // If status is being changed to unsubscribed, set unsubscribed_at
    if (body.status === 'unsubscribed' && existingSubscription.status !== 'unsubscribed') {
      updateData.unsubscribed_at = new Date().toISOString();
    }

    // If status is being changed from unsubscribed to subscribed, clear unsubscribed_at
    if (body.status === 'subscribed' && existingSubscription.status === 'unsubscribed') {
      updateData.unsubscribed_at = null;
      updateData.subscribed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Newsletter subscription updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/newsletter/[id] - Delete newsletter subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if subscription exists
    const { data: existingSubscription, error: checkError } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Newsletter subscription not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Delete the subscription
    const { error } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createSuccessResponse(null, 'Newsletter subscription deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}