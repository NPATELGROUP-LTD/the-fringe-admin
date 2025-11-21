import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; email: string; error: string }>;
}

// POST /api/newsletter/import - Import newsletter subscribers from CSV
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return createErrorResponse('No file provided', HTTP_STATUS.BAD_REQUEST);
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return createErrorResponse('File must be a CSV file', HTTP_STATUS.BAD_REQUEST);
    }

    // Read file content
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return createErrorResponse('CSV file must contain at least a header row and one data row', HTTP_STATUS.BAD_REQUEST);
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['email'];

    // Check for required headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return createErrorResponse(
        `Missing required columns: ${missingHeaders.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const emailIndex = headers.indexOf('email');
    const firstNameIndex = headers.indexOf('first_name') !== -1 ? headers.indexOf('first_name') : headers.indexOf('firstname');
    const lastNameIndex = headers.indexOf('last_name') !== -1 ? headers.indexOf('last_name') : headers.indexOf('lastname');
    const interestsIndex = headers.indexOf('interests');
    const statusIndex = headers.indexOf('status');

    const result: ImportResult = {
      total: lines.length - 1, // Exclude header
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, '')); // Remove quotes

      const email = columns[emailIndex]?.toLowerCase().trim();
      const firstName = firstNameIndex !== -1 ? columns[firstNameIndex]?.trim() : null;
      const lastName = lastNameIndex !== -1 ? columns[lastNameIndex]?.trim() : null;
      const interests = interestsIndex !== -1 ? columns[interestsIndex]?.trim() : null;
      const status = statusIndex !== -1 ? columns[statusIndex]?.trim().toLowerCase() : 'pending';

      // Validate email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          email: email || 'invalid',
          error: 'Invalid email address',
        });
        continue;
      }

      // Validate status
      if (!['pending', 'subscribed', 'unsubscribed'].includes(status)) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          email,
          error: 'Invalid status. Must be pending, subscribed, or unsubscribed',
        });
        continue;
      }

      try {
        // Check if subscriber already exists
        const { data: existing } = await supabaseAdmin
          .from('newsletter_subscriptions')
          .select('id')
          .eq('email', email)
          .single();

        if (existing) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            email,
            error: 'Email already exists in newsletter subscriptions',
          });
          continue;
        }

        // Parse interests
        let interestsArray: string[] | null = null;
        if (interests) {
          interestsArray = interests.split(';').map(i => i.trim()).filter(i => i.length > 0);
        }

        // Create subscription
        const subscriptionData = {
          email,
          first_name: firstName || null,
          last_name: lastName || null,
          status,
          interests: interestsArray,
          subscribed_at: status === 'subscribed' ? new Date().toISOString() : null,
        };

        const { error: insertError } = await supabaseAdmin
          .from('newsletter_subscriptions')
          .insert(subscriptionData);

        if (insertError) throw insertError;

        result.successful++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return createSuccessResponse(result, `Import completed: ${result.successful} successful, ${result.failed} failed`);

  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}