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
import type { FAQ } from '@/types/database';

// Types for this endpoint
interface CreateFAQRequest {
  category?: string;
  question: string;
  answer: string;
  sort_order?: number;
  is_active?: boolean;
}

interface UpdateFAQRequest extends Partial<CreateFAQRequest> {}

// GET /api/faqs - List all FAQs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const isActive = searchParams.get('is_active');

    // Build query
    let query = supabaseAdmin
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) throw error;

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('faqs')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);
    }

    if (category) {
      countQuery = countQuery.eq('category', category);
    }

    if (isActive !== null) {
      countQuery = countQuery.eq('is_active', isActive === 'true');
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

// POST /api/faqs - Create new FAQ
export async function POST(request: NextRequest) {
  try {
    const body: CreateFAQRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['question', 'answer']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create the FAQ
    const newFAQ = {
      ...body,
      sort_order: body.sort_order || 0,
      is_active: body.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('faqs')
      .insert(newFAQ)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'FAQ created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}