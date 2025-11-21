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
import type { Service } from '@/types/database';

// Types for this endpoint
interface CreateServiceRequest {
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  duration: number;
  category_id?: string;
  image_url?: string;
  features?: string[];
  is_active?: boolean;
}

interface UpdateServiceRequest extends Partial<CreateServiceRequest> {}

// GET /api/services - List all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('category_id');
    const isActive = searchParams.get('is_active');

    // Build query
    let query = supabaseAdmin
      .from('services')
      .select(`
        *,
        service_categories (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
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
      .from('services')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (categoryId) {
      countQuery = countQuery.eq('category_id', categoryId);
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

// POST /api/services - Create new service
export async function POST(request: NextRequest) {
  try {
    const body: CreateServiceRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['title', 'slug', 'description', 'price', 'duration']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check if slug is unique
    const { data: existingService, error: checkError } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('slug', body.slug)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw checkError;
    }

    if (existingService) {
      return createErrorResponse(
        'Service slug must be unique',
        HTTP_STATUS.CONFLICT
      );
    }

    // Create the service
    const newService = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('services')
      .insert(newService)
      .select(`
        *,
        service_categories (
          id,
          name,
          slug
        )
      `)
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Service created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}