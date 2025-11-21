import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createSuccessResponse, handleApiError } from '@/lib/api/utils';

interface UpdateStatisticRequest {
  value?: number;
  label?: string;
  category?: string;
  period?: string;
}

// GET /api/statistics/[key] - Get specific statistic
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current';

    const { data, error } = await supabaseAdmin
      .from('statistics')
      .select('*')
      .eq('key', params.key)
      .eq('period', period)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/statistics/[key] - Update specific statistic
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const body: UpdateStatisticRequest = await request.json();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current';

    const { data, error } = await supabaseAdmin
      .from('statistics')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('key', params.key)
      .eq('period', period)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Statistic updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/statistics/[key] - Delete specific statistic
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current';

    const { error } = await supabaseAdmin
      .from('statistics')
      .delete()
      .eq('key', params.key)
      .eq('period', period);

    if (error) throw error;

    return createSuccessResponse({ success: true }, 'Statistic deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}