import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// Mock email service - replace with actual email service (SendGrid, Mailgun, etc.)
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // TODO: Replace with actual email service implementation
  console.log(`Sending email to ${to}:`, { subject, html });

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // For now, always return success. In production, this would integrate with:
  // - SendGrid: @sendgrid/mail
  // - Mailgun: mailgun-js
  // - AWS SES: @aws-sdk/client-ses
  // - Or nodemailer for SMTP

  return true;
}

interface SendNewsletterRequest {
  subscriberIds: string[];
  subject: string;
  content: string;
  fromName?: string;
  fromEmail?: string;
}

// POST /api/newsletter/send - Send bulk newsletter emails
export async function POST(request: NextRequest) {
  try {
    const body: SendNewsletterRequest = await request.json();

    // Validate required fields
    if (!body.subscriberIds || !Array.isArray(body.subscriberIds) || body.subscriberIds.length === 0) {
      return createErrorResponse('subscriberIds array is required and cannot be empty', HTTP_STATUS.BAD_REQUEST);
    }

    if (!body.subject || typeof body.subject !== 'string' || body.subject.trim().length === 0) {
      return createErrorResponse('subject is required', HTTP_STATUS.BAD_REQUEST);
    }

    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return createErrorResponse('content is required', HTTP_STATUS.BAD_REQUEST);
    }

    // Get subscriber emails
    const { data: subscribers, error } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .select('id, email, first_name, last_name, status')
      .in('id', body.subscriberIds)
      .eq('status', 'subscribed');

    if (error) throw error;

    if (!subscribers || subscribers.length === 0) {
      return createErrorResponse('No valid subscribers found', HTTP_STATUS.BAD_REQUEST);
    }

    // Filter out unsubscribed users (double check)
    const validSubscribers = subscribers.filter(sub => sub.status === 'subscribed');

    if (validSubscribers.length === 0) {
      return createErrorResponse('No subscribed users found in the selection', HTTP_STATUS.BAD_REQUEST);
    }

    // Send emails (in production, this should be done asynchronously with a job queue)
    const emailPromises = validSubscribers.map(async (subscriber) => {
      const personalizedContent = body.content
        .replace(/\{\{first_name\}\}/g, subscriber.first_name || '')
        .replace(/\{\{last_name\}\}/g, subscriber.last_name || '')
        .replace(/\{\{email\}\}/g, subscriber.email);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${body.subject}</title>
        </head>
        <body>
          ${personalizedContent}
          <br><br>
          <hr>
          <p style="font-size: 12px; color: #666;">
            You're receiving this email because you subscribed to our newsletter.
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com'}/unsubscribe?email=${encodeURIComponent(subscriber.email)}">Unsubscribe</a>
          </p>
        </body>
        </html>
      `;

      try {
        await sendEmail(subscriber.email, body.subject, htmlContent);
        return { email: subscriber.email, success: true };
      } catch (error) {
        console.error(`Failed to send email to ${subscriber.email}:`, error);
        return { email: subscriber.email, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return createSuccessResponse({
      total: validSubscribers.length,
      successful,
      failed,
      results: results.filter(r => !r.success), // Only return failures for error details
    }, `Newsletter sent to ${successful} subscribers${failed > 0 ? `, ${failed} failed` : ''}`);

  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}