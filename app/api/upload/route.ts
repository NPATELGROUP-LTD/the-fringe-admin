import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api/utils';
import { uploadFile, deleteFile, STORAGE_BUCKETS, FOLDER_STRUCTURE, FILE_CONSTRAINTS } from '@/lib/supabase/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || STORAGE_BUCKETS.PUBLIC;
    const folder = (formData.get('folder') as string) || FOLDER_STRUCTURE.TEMP;
    const fileType = (formData.get('type') as 'image' | 'document' | 'video') || 'image';
    const prefix = formData.get('prefix') as string;

    if (!file) {
      return createErrorResponse('No file provided', 400);
    }

    // Validate bucket
    if (!Object.values(STORAGE_BUCKETS).includes(bucket as any)) {
      return createErrorResponse('Invalid bucket specified', 400);
    }

    // Validate folder
    if (!Object.values(FOLDER_STRUCTURE).includes(folder as any)) {
      return createErrorResponse('Invalid folder specified', 400);
    }

    // Upload file using storage utility
    const result = await uploadFile(file, bucket, folder, {
      prefix,
    });

    if (!result.success) {
      return createErrorResponse(result.error || 'Upload failed', 400);
    }

    return createSuccessResponse(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const bucket = searchParams.get('bucket') || STORAGE_BUCKETS.PUBLIC;

    if (!path) {
      return createErrorResponse('File path is required', 400);
    }

    // Validate bucket
    if (!Object.values(STORAGE_BUCKETS).includes(bucket as any)) {
      return createErrorResponse('Invalid bucket specified', 400);
    }

    const result = await deleteFile(path, bucket);

    if (!result.success) {
      return createErrorResponse(result.error || 'Delete failed', 400);
    }

    return createSuccessResponse({
      message: 'File deleted successfully'
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}