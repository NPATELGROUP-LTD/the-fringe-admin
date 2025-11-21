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
import type { SiteSetting } from '@/types/database';

// Types for this endpoint
interface CreateSiteSettingRequest {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description?: string;
  is_public?: boolean;
}

interface UpdateSiteSettingRequest extends Partial<CreateSiteSettingRequest> {}

// GET /api/site-settings - List all site settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const isPublic = searchParams.get('is_public');

    // Build query
    let query = supabaseAdmin
      .from('site_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true });

    // Apply filters
    if (search) {
      query = query.or(`key.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (isPublic !== null) {
      query = query.eq('is_public', isPublic === 'true');
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) throw error;

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('site_settings')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`key.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      countQuery = countQuery.eq('category', category);
    }

    if (type) {
      countQuery = countQuery.eq('type', type);
    }

    if (isPublic !== null) {
      countQuery = countQuery.eq('is_public', isPublic === 'true');
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

// POST /api/site-settings - Create new site setting
export async function POST(request: NextRequest) {
  try {
    const body: CreateSiteSettingRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['key', 'value', 'type', 'category']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate type matches value
    const { type, value } = body;
    if (type === 'number' && typeof value !== 'number') {
      return createErrorResponse('Value must be a number for type "number"', HTTP_STATUS.BAD_REQUEST);
    }
    if (type === 'boolean' && typeof value !== 'boolean') {
      return createErrorResponse('Value must be a boolean for type "boolean"', HTTP_STATUS.BAD_REQUEST);
    }
    if (type === 'string' && typeof value !== 'string') {
      return createErrorResponse('Value must be a string for type "string"', HTTP_STATUS.BAD_REQUEST);
    }
    if (type === 'json' && (typeof value !== 'object' || value === null)) {
      return createErrorResponse('Value must be an object for type "json"', HTTP_STATUS.BAD_REQUEST);
    }

    // Check if key already exists
    const { data: existingSetting } = await supabaseAdmin
      .from('site_settings')
      .select('id')
      .eq('key', body.key)
      .single();

    if (existingSetting) {
      return createErrorResponse('Setting key already exists', HTTP_STATUS.CONFLICT);
    }

    // Create the site setting
    const newSetting = {
      ...body,
      is_public: body.is_public ?? false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .insert(newSetting)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Site setting created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}