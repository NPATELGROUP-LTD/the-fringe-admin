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

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateTemplateRequest {
  name: string;
  subject: string;
  content: string;
  category?: string;
}

// GET /api/newsletter/templates - List all email templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabaseAdmin
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return createSuccessResponse(data || []);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/newsletter/templates - Create new email template
export async function POST(request: NextRequest) {
  try {
    const body: CreateTemplateRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['name', 'subject', 'content']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check if template name already exists
    const { data: existingTemplate } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('name', body.name)
      .single();

    if (existingTemplate) {
      return createErrorResponse(
        'Template name already exists',
        HTTP_STATUS.CONFLICT
      );
    }

    const newTemplate = {
      ...body,
      category: body.category || 'general',
      is_active: true,
    };

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .insert(newTemplate)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Email template created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}