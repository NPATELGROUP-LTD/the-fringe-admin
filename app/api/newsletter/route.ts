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
import type { NewsletterSubscription } from '@/types/database';

// Types for this endpoint
interface CreateNewsletterRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  status?: 'subscribed' | 'unsubscribed' | 'pending';
  interests?: string[];
}

interface UpdateNewsletterRequest extends Partial<CreateNewsletterRequest> {}

// GET /api/newsletter - List all newsletter subscriptions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Build query
    let query = supabaseAdmin
      .from('newsletter_subscriptions')
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) throw error;

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) throw countError;

    return createSuccessResponse({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/newsletter - Create new newsletter subscription
export async function POST(request: NextRequest) {
  try {
    const body: CreateNewsletterRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['email']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check if email already exists
    const { data: existingSubscription } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existingSubscription) {
      return createErrorResponse(
        'Email is already subscribed to the newsletter',
        HTTP_STATUS.CONFLICT
      );
    }

    // Create the subscription
    const newSubscription = {
      ...body,
      status: body.status || 'pending',
      subscribed_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .insert(newSubscription)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Newsletter subscription created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}