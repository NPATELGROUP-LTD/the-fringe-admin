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
import type { Testimonial } from '@/types/database';

// Types for this endpoint
interface CreateTestimonialRequest {
  name: string;
  email: string;
  company?: string;
  position?: string;
  content: string;
  rating: number;
  image_url?: string;
}

interface UpdateTestimonialRequest extends Partial<CreateTestimonialRequest> {
  is_approved?: boolean;
  is_featured?: boolean;
}

// GET /api/testimonials - List all testimonials
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const isApproved = searchParams.get('is_approved');
    const isFeatured = searchParams.get('is_featured');
    const rating = searchParams.get('rating');

    // Build query
    let query = supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,position.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (isApproved !== null) {
      query = query.eq('is_approved', isApproved === 'true');
    }

    if (isFeatured !== null) {
      query = query.eq('is_featured', isFeatured === 'true');
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
      .from('testimonials')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,position.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (isApproved !== null) {
      countQuery = countQuery.eq('is_approved', isApproved === 'true');
    }

    if (isFeatured !== null) {
      countQuery = countQuery.eq('is_featured', isFeatured === 'true');
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

// POST /api/testimonials - Create new testimonial
export async function POST(request: NextRequest) {
  try {
    const body: CreateTestimonialRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['name', 'email', 'content', 'rating']);
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

    // Create the testimonial
    const newTestimonial = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .insert(newTestimonial)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Testimonial created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}