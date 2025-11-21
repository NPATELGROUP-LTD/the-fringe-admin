/**
 * API Route Template
 *
 * This is a template for creating new API routes in the admin panel.
 * Copy this file and customize it for your specific endpoint.
 *
 * Usage:
 * 1. Copy this file to app/api/[your-endpoint]/route.ts
 * 2. Replace [YourEndpoint] with your actual endpoint name
 * 3. Implement the business logic in the handler functions
 * 4. Update the validation and error handling as needed
 */

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

// Types for this endpoint
interface YourEndpointData {
  id: string;
  // Add your data fields here
  [key: string]: any;
}

interface CreateYourEndpointRequest {
  // Add your request fields here
  name: string;
}

interface UpdateYourEndpointRequest {
  // Add your request fields here
  name?: string;
}

// GET /api/your-endpoint - List all items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    // Build query - replace 'your_table' with actual table name
    const { data, error } = await supabaseAdmin
      .from('your_table')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('your_table')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    return createSuccessResponse({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/your-endpoint - Create new item
export async function POST(request: NextRequest) {
  try {
    const body: CreateYourEndpointRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['name']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create the item
    const newItem = {
      ...body,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('your_table')
      .insert(newItem)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Item created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/[your-endpoint]/[id] - Update item (would be in a separate file)
// PATCH /api/[your-endpoint]/[id] - Partial update (would be in a separate file)
// DELETE /api/[your-endpoint]/[id] - Delete item (would be in a separate file)

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}