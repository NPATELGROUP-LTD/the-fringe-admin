import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/email/campaigns/[id]/analytics - Get campaign analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if campaign exists
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select('id, name, sent_at, total_recipients, sent_count, opened_count, clicked_count, bounced_count, unsubscribed_count')
      .eq('id', id)
      .single();

    if (campaignError) {
      if (campaignError.code === 'PGRST116') {
        return createErrorResponse('Campaign not found', HTTP_STATUS.NOT_FOUND);
      }
      throw campaignError;
    }

    // Get detailed send analytics
    const { data: sends, error: sendsError } = await supabaseAdmin
      .from('email_campaign_sends')
      .select('status, opened_at, clicked_at, bounced_at, unsubscribed_at')
      .eq('campaign_id', id);

    if (sendsError) throw sendsError;

    // Calculate metrics
    const totalSent = sends?.length || 0;
    const opened = sends?.filter(s => s.opened_at).length || 0;
    const clicked = sends?.filter(s => s.clicked_at).length || 0;
    const bounced = sends?.filter(s => s.bounced_at).length || 0;
    const unsubscribed = sends?.filter(s => s.unsubscribed_at).length || 0;

    const openRate = totalSent > 0 ? (opened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (clicked / totalSent) * 100 : 0;
    const clickToOpenRate = opened > 0 ? (clicked / opened) * 100 : 0;
    const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
    const unsubscribeRate = totalSent > 0 ? (unsubscribed / totalSent) * 100 : 0;

    // Get hourly/daily breakdown (simplified - in real app you'd aggregate properly)
    const hourlyStats = sends?.reduce((acc: any, send) => {
      if (send.opened_at) {
        const hour = new Date(send.opened_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const analytics = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        sent_at: campaign.sent_at,
      },
      overview: {
        total_recipients: campaign.total_recipients,
        sent_count: campaign.sent_count,
        opened_count: opened,
        clicked_count: clicked,
        bounced_count: bounced,
        unsubscribed_count: unsubscribed,
      },
      rates: {
        open_rate: Math.round(openRate * 100) / 100,
        click_rate: Math.round(clickRate * 100) / 100,
        click_to_open_rate: Math.round(clickToOpenRate * 100) / 100,
        bounce_rate: Math.round(bounceRate * 100) / 100,
        unsubscribe_rate: Math.round(unsubscribeRate * 100) / 100,
      },
      hourly_breakdown: hourlyStats,
    };

    return createSuccessResponse(analytics);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}