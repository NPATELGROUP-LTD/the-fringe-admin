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
import type { BusinessInfo } from '@/types/database';

// Types for this endpoint
interface CreateBusinessInfoRequest {
  key: string;
  value: any;
  type: 'text' | 'email' | 'phone' | 'address' | 'hours' | 'social';
  is_active?: boolean;
}

interface UpdateBusinessInfoRequest extends Partial<CreateBusinessInfoRequest> {}

// GET /api/business-info - List all business info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const isActive = searchParams.get('is_active');

    // Build query
    let query = supabaseAdmin
      .from('business_info')
      .select('*')
      .order('type', { ascending: true })
      .order('key', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`key.ilike.%${search}%,type.ilike.%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
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
      .from('business_info')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`key.ilike.%${search}%,type.ilike.%${search}%`);
    }

    if (type) {
      countQuery = countQuery.eq('type', type);
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

// POST /api/business-info - Create new business info
export async function POST(request: NextRequest) {
  try {
    const body: CreateBusinessInfoRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['key', 'value', 'type']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate type
    const validTypes = ['text', 'email', 'phone', 'address', 'hours', 'social'];
    if (!validTypes.includes(body.type)) {
      return createErrorResponse(
        `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check if key already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('business_info')
      .select('id')
      .eq('key', body.key)
      .single();

    if (existing) {
      return createErrorResponse(
        'Business info with this key already exists',
        HTTP_STATUS.CONFLICT
      );
    }

    // Create the business info
    const newBusinessInfo = {
      ...body,
      is_active: body.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('business_info')
      .insert(newBusinessInfo)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Business info created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}