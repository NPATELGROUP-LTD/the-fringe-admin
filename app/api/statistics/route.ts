import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createSuccessResponse, handleApiError } from '@/lib/api/utils';
import type { Statistic } from '@/types/database';

interface CreateStatisticRequest {
  key: string;
  value: number;
  label: string;
  category: string;
  period?: string;
}

interface UpdateStatisticRequest {
  value?: number;
  label?: string;
  category?: string;
  period?: string;
}

// GET /api/statistics - Get all statistics or filter by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const key = searchParams.get('key');
    const limit = searchParams.get('limit');

    let query = supabaseAdmin
      .from('statistics')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (key) {
      query = query.eq('key', key);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) throw error;

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/statistics - Create new statistic
export async function POST(request: NextRequest) {
  try {
    const body: CreateStatisticRequest = await request.json();

    const { data, error } = await supabaseAdmin
      .from('statistics')
      .insert({
        key: body.key,
        value: body.value,
        label: body.label,
        category: body.category,
        period: body.period,
      })
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data, 'Statistic created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/statistics - Bulk update statistics
export async function PUT(request: NextRequest) {
  try {
    const body: { updates: Array<{ key: string; value: number; period?: string }> } = await request.json();

    const promises = body.updates.map(update =>
      supabaseAdmin
        .from('statistics')
        .update({
          value: update.value,
          updated_at: new Date().toISOString()
        })
        .eq('key', update.key)
        .eq('period', update.period || 'current')
    );

    await Promise.all(promises);

    return createSuccessResponse({ success: true }, 'Statistics updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}