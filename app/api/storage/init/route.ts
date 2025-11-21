import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api/utils';
import { initializeStorageBuckets } from '@/lib/supabase/storage';

export async function POST(request: NextRequest) {
  try {
    // This should be protected by admin authentication
    // For now, we'll assume it's called from authenticated admin context

    await initializeStorageBuckets();

    return createSuccessResponse({
      message: 'Storage buckets initialized successfully'
    });
  } catch (error) {
    return handleApiError(error);
  }
}