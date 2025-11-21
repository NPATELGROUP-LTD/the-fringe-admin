import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  HTTP_STATUS,
  handleOptionsRequest,
} from '@/lib/api/utils';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET /api/categories/[id] - Get single course category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('courses_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return createErrorResponse('Category not found', HTTP_STATUS.NOT_FOUND);
      }
      throw error;
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/categories/[id] - Update course category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if category exists
    const { data: existingCategory, error: checkError } = await supabaseAdmin
      .from('courses_categories')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Category not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // If slug is being updated, check uniqueness
    if (body.slug) {
      const { data: existingSlug, error: slugError } = await supabaseAdmin
        .from('courses_categories')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', id)
        .single();

      if (slugError && slugError.code !== 'PGRST116') {
        throw slugError;
      }

      if (existingSlug) {
        return createErrorResponse(
          'Category slug must be unique',
          HTTP_STATUS.CONFLICT
        );
      }
    }

    // Update the category
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('courses_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Category updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/categories/[id] - Delete course category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if category exists
    const { data: existingCategory, error: checkError } = await supabaseAdmin
      .from('courses_categories')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // Not found
        return createErrorResponse('Category not found', HTTP_STATUS.NOT_FOUND);
      }
      throw checkError;
    }

    // Check if category is being used by courses
    const { data: coursesUsingCategory, error: usageError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (usageError) throw usageError;

    if (coursesUsingCategory && coursesUsingCategory.length > 0) {
      return createErrorResponse(
        'Cannot delete category that is assigned to courses',
        HTTP_STATUS.CONFLICT
      );
    }

    // Delete the category
    const { error } = await supabaseAdmin
      .from('courses_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createSuccessResponse(null, 'Category deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin || undefined);
}