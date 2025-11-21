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
import type { ContactSubmission } from '@/types/database';

// Types for this endpoint
interface CreateContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

interface UpdateContactRequest extends Partial<CreateContactRequest> {
  is_read?: boolean;
  responded_at?: string;
  response?: string;
}

// GET /api/contacts - List all contact submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const isRead = searchParams.get('is_read');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Build query
    let query = supabaseAdmin
      .from('contact_submissions')
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`);
    }

    if (isRead !== null) {
      query = query.eq('is_read', isRead === 'true');
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) throw error;

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`);
    }

    if (isRead !== null) {
      countQuery = countQuery.eq('is_read', isRead === 'true');
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

// POST /api/contacts - Create new contact submission
export async function POST(request: NextRequest) {
  try {
    const body: CreateContactRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['name', 'email', 'subject', 'message']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create the contact submission
    const newContact = {
      ...body,
      is_read: false, // New submissions are unread by default
    };

    const { data, error } = await supabaseAdmin
      .from('contact_submissions')
      .insert(newContact)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Contact submission created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}