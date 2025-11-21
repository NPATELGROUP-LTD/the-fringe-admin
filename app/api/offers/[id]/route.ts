import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/offers/[id] - Get single offer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('offers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return createErrorResponse('Offer not found', HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/offers/[id] - Update offer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if offer exists
    const { data: existingOffer, error: checkError } = await supabaseAdmin
      .from('offers')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Offer not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Validate discount value if provided
    if (body.discount_value !== undefined && body.discount_value <= 0) {
      return createErrorResponse(
        'Discount value must be greater than 0',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate discount type specific rules
    if (body.discount_type === 'percentage' && body.discount_value > 100) {
      return createErrorResponse(
        'Percentage discount cannot exceed 100%',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate dates if provided
    if (body.valid_from && body.valid_until) {
      const validFrom = new Date(body.valid_from);
      const validUntil = new Date(body.valid_until);

      if (validFrom >= validUntil) {
        return createErrorResponse(
          'Valid until date must be after valid from date',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    // Update the offer
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('offers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Offer updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/offers/[id] - Delete offer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if offer exists
    const { data: existingOffer, error: checkError } = await supabaseAdmin
      .from('offers')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Offer not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Delete the offer
    const { error } = await supabaseAdmin
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createSuccessResponse(null, 'Offer deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}