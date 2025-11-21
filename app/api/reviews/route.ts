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
import type { Review } from '@/types/database';

// Types for this endpoint
interface CreateReviewRequest {
  course_id?: string;
  name: string;
  email: string;
  rating: number;
  title: string;
  content: string;
}

interface UpdateReviewRequest extends Partial<CreateReviewRequest> {
  is_approved?: boolean;
}

// GET /api/reviews - List all reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const isApproved = searchParams.get('is_approved');
    const courseId = searchParams.get('course_id');
    const rating = searchParams.get('rating');

    // Build query
    let query = supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (isApproved !== null) {
      query = query.eq('is_approved', isApproved === 'true');
    }

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) throw error;

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (isApproved !== null) {
      countQuery = countQuery.eq('is_approved', isApproved === 'true');
    }

    if (courseId) {
      countQuery = countQuery.eq('course_id', courseId);
    }

    if (rating) {
      countQuery = countQuery.eq('rating', parseInt(rating));
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

// POST /api/reviews - Create new review
export async function POST(request: NextRequest) {
  try {
    const body: CreateReviewRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['name', 'email', 'rating', 'title', 'content']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate rating
    if (body.rating < 1 || body.rating > 5) {
      return createErrorResponse(
        'Rating must be between 1 and 5',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return createErrorResponse(
        'Invalid email format',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create the review
    const newReview = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert(newReview)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Review created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}