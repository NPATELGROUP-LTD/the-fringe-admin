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

interface EmailTrigger {
  id: string;
  name: string;
  event_type: string;
  template_id?: string;
  conditions: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateTriggerRequest {
  name: string;
  event_type: string;
  template_id?: string;
  conditions?: Record<string, any>;
}

// GET /api/email/triggers - List all email triggers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('event_type');
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabaseAdmin
      .from('email_triggers')
      .select(`
        *,
        email_templates (
          id,
          name,
          subject
        )
      `)
      .order('created_at', { ascending: false });

    if (eventType) {
      query = query.eq('event_type', eventType);
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

// POST /api/email/triggers - Create new email trigger
export async function POST(request: NextRequest) {
  try {
    const body: CreateTriggerRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['name', 'event_type']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check if trigger name already exists
    const { data: existingTrigger } = await supabaseAdmin
      .from('email_triggers')
      .select('id')
      .eq('name', body.name)
      .single();

    if (existingTrigger) {
      return createErrorResponse(
        'Trigger name already exists',
        HTTP_STATUS.CONFLICT
      );
    }

    // If template_id is provided, verify it exists
    if (body.template_id) {
      const { data: template } = await supabaseAdmin
        .from('email_templates')
        .select('id')
        .eq('id', body.template_id)
        .single();

      if (!template) {
        return createErrorResponse(
          'Email template not found',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    const newTrigger = {
      ...body,
      conditions: body.conditions || {},
      is_active: true,
    };

    const { data, error } = await supabaseAdmin
      .from('email_triggers')
      .insert(newTrigger)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Email trigger created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}