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

interface SmtpSettings {
  id: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  encryption: 'none' | 'ssl' | 'tls';
  from_email: string;
  from_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateSmtpRequest {
  host: string;
  port: number;
  username?: string;
  password?: string;
  encryption?: 'none' | 'ssl' | 'tls';
  from_email: string;
  from_name?: string;
}

// GET /api/email/smtp - Get SMTP settings
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_smtp_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return createSuccessResponse(data || []);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/email/smtp - Create new SMTP settings
export async function POST(request: NextRequest) {
  try {
    const body: CreateSmtpRequest = await request.json();

    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['host', 'port', 'from_email']);
    if (!isValid) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // If this is set as active, deactivate all others
    const newSettings = {
      ...body,
      encryption: body.encryption || 'tls',
      is_active: true,
    };

    // Start a transaction-like operation
    // First, deactivate all existing settings
    await supabaseAdmin
      .from('email_smtp_settings')
      .update({ is_active: false })
      .eq('is_active', true);

    // Then create the new settings
    const { data, error } = await supabaseAdmin
      .from('email_smtp_settings')
      .insert(newSettings)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'SMTP settings created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}