import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/reviews/[id] - Get single review
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return createErrorResponse('Review not found', HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/reviews/[id] - Update review
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if review exists
    const { data: existingReview, error: checkError } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Review not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Validate rating if provided
    if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
      return createErrorResponse(
        'Rating must be between 1 and 5',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate email format if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return createErrorResponse(
          'Invalid email format',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    // Handle approval workflow
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    if (body.is_approved === true) {
      updateData.approved_at = new Date().toISOString();
      // Note: approved_by would need to be set from auth context
      // For now, we'll assume it's handled in the admin interface
    } else if (body.is_approved === false) {
      updateData.approved_at = null;
      updateData.approved_by = null;
    }

    // Handle response workflow
    if (body.response !== undefined) {
      if (body.response && body.response.trim()) {
        updateData.responded_at = new Date().toISOString();
        // Note: responded_by would need to be set from auth context
      } else {
        updateData.response = null;
        updateData.responded_at = null;
        updateData.responded_by = null;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Review updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/reviews/[id] - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if review exists
    const { data: existingReview, error: checkError } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Review not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Delete the review
    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createSuccessResponse(null, 'Review deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}