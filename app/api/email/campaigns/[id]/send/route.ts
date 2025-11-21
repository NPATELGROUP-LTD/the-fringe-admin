import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// POST /api/email/campaigns/[id]/send - Send campaign to subscribers
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError) {
      if (campaignError.code === 'PGRST116') {
        return createErrorResponse('Campaign not found', HTTP_STATUS.NOT_FOUND);
      }
      throw campaignError;
    }

    if (campaign.status !== 'draft') {
      return createErrorResponse('Campaign has already been sent or is not in draft status', HTTP_STATUS.BAD_REQUEST);
    }

    // Build subscriber query based on segment filters
    let subscriberQuery = supabaseAdmin
      .from('newsletter_subscriptions')
      .select('id, email, first_name, last_name')
      .eq('status', 'subscribed');

    const segmentFilters = campaign.segment_filters || {};

    // Apply filters
    if (segmentFilters.status) {
      subscriberQuery = subscriberQuery.eq('status', segmentFilters.status);
    }

    if (segmentFilters.interests) {
      const interests = segmentFilters.interests.split(',').map((i: string) => i.trim());
      subscriberQuery = subscriberQuery.overlaps('interests', interests);
    }

    if (segmentFilters.subscribed_after) {
      subscriberQuery = subscriberQuery.gte('subscribed_at', segmentFilters.subscribed_after);
    }

    if (segmentFilters.subscribed_before) {
      subscriberQuery = subscriberQuery.lte('subscribed_at', segmentFilters.subscribed_before);
    }

    const { data: subscribers, error: subscribersError } = await subscriberQuery;

    if (subscribersError) throw subscribersError;

    if (!subscribers || subscribers.length === 0) {
      return createErrorResponse('No subscribers match the campaign criteria', HTTP_STATUS.BAD_REQUEST);
    }

    // Update campaign status and recipient count
    const { error: updateError } = await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: 'sending',
        total_recipients: subscribers.length,
        sent_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Create campaign send records
    const sendRecords = subscribers.map(subscriber => ({
      campaign_id: id,
      subscriber_id: subscriber.id,
      status: 'sent',
    }));

    const { error: sendsError } = await supabaseAdmin
      .from('email_campaign_sends')
      .insert(sendRecords);

    if (sendsError) throw sendsError;

    // Update campaign as sent
    const { error: finalUpdateError } = await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_count: subscribers.length,
      })
      .eq('id', id);

    if (finalUpdateError) throw finalUpdateError;

    // TODO: Actually send emails via SMTP
    // This would integrate with your email service provider
    // For now, we'll just mark them as sent in the database

    return createSuccessResponse({
      message: `Campaign sent to ${subscribers.length} subscribers`,
      recipient_count: subscribers.length,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}