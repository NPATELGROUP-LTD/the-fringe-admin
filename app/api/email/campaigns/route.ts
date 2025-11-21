import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  validateRequiredFields,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';
import { EmailCampaign } from '@/types/database';

interface CreateCampaignRequest {
  name: string;
  subject: string;
  content: string;
  template_id?: string;
  segment_filters?: Record<string, any>;
  scheduled_at?: string;
}

// GET /api/email/campaigns - Get all campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return createSuccessResponse({
      data: data || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/email/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const body: CreateCampaignRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['name', 'subject', 'content']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Get current user ID (assuming from auth context)
    // For now, we'll set created_by to null since we don't have auth context here
    const campaignData = {
      ...body,
      status: 'draft',
      segment_filters: body.segment_filters || {},
      total_recipients: 0,
      sent_count: 0,
      opened_count: 0,
      clicked_count: 0,
      bounced_count: 0,
      unsubscribed_count: 0,
    };

    const { data, error } = await supabaseAdmin
      .from('email_campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Campaign created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}