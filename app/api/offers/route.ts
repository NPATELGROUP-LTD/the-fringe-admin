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
import type { Offer } from '@/types/database';

// Types for this endpoint
interface CreateOfferRequest {
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  is_active?: boolean;
}

interface UpdateOfferRequest extends Partial<CreateOfferRequest> {}

// GET /api/offers - List all offers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const isActive = searchParams.get('is_active');
    const discountType = searchParams.get('discount_type');

    // Build query
    let query = supabaseAdmin
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (discountType) {
      query = query.eq('discount_type', discountType);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) throw error;

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('offers')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (isActive !== null) {
      countQuery = countQuery.eq('is_active', isActive === 'true');
    }

    if (discountType) {
      countQuery = countQuery.eq('discount_type', discountType);
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

// POST /api/offers - Create new offer
export async function POST(request: NextRequest) {
  try {
    const body: CreateOfferRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['title', 'description', 'discount_type', 'discount_value', 'valid_from', 'valid_until']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate discount value
    if (body.discount_value <= 0) {
      return createErrorResponse(
        'Discount value must be greater than 0',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate discount type specific rules
    if (body.discount_type === 'percentage' && body.discount_value > 100) {
      return createErrorResponse(
        'Percentage discount cannot exceed 100%',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate dates
    const validFrom = new Date(body.valid_from);
    const validUntil = new Date(body.valid_until);
    const now = new Date();

    if (validFrom >= validUntil) {
      return createErrorResponse(
        'Valid until date must be after valid from date',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create the offer
    const newOffer = {
      ...body,
      usage_count: 0,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('offers')
      .insert(newOffer)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Offer created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}