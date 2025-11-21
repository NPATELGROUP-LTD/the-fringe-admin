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
  errors: Array<{ row: number; field: string; error: string }>;
}

// POST /api/courses/import - Import courses from CSV
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
    const requiredHeaders = ['title', 'slug', 'price', 'duration'];

    // Check for required headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return createErrorResponse(
        `Missing required columns: ${missingHeaders.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const titleIndex = headers.indexOf('title');
    const slugIndex = headers.indexOf('slug');
    const descriptionIndex = headers.indexOf('description');
    const priceIndex = headers.indexOf('price');
    const durationIndex = headers.indexOf('duration');
    const categoryIdIndex = headers.indexOf('category_id');
    const isActiveIndex = headers.indexOf('is_active');

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

      const title = columns[titleIndex]?.trim();
      const slug = columns[slugIndex]?.trim().toLowerCase();
      const description = descriptionIndex !== -1 ? columns[descriptionIndex]?.trim() : null;
      const price = columns[priceIndex]?.trim();
      const duration = columns[durationIndex]?.trim();
      const categoryId = categoryIdIndex !== -1 ? columns[categoryIdIndex]?.trim() : null;
      const isActive = isActiveIndex !== -1 ? columns[isActiveIndex]?.trim().toLowerCase() : 'true';

      // Validate required fields
      if (!title || !slug || !price || !duration) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          field: 'required_fields',
          error: 'Missing required fields: title, slug, price, duration',
        });
        continue;
      }

      // Validate price
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          field: 'price',
          error: 'Invalid price value',
        });
        continue;
      }

      // Validate duration
      const durationNum = parseInt(duration);
      if (isNaN(durationNum) || durationNum <= 0) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          field: 'duration',
          error: 'Invalid duration value',
        });
        continue;
      }

      // Validate is_active
      if (!['true', 'false'].includes(isActive)) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          field: 'is_active',
          error: 'Invalid is_active value. Must be true or false',
        });
        continue;
      }

      try {
        // Check if course with this slug already exists
        const { data: existing } = await supabaseAdmin
          .from('courses')
          .select('id')
          .eq('slug', slug)
          .single();

        if (existing) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            field: 'slug',
            error: 'Course with this slug already exists',
          });
          continue;
        }

        // Create course
        const courseData = {
          title,
          slug,
          description,
          price: priceNum,
          duration: durationNum,
          category_id: categoryId || null,
          is_active: isActive === 'true',
        };

        const { error: insertError } = await supabaseAdmin
          .from('courses')
          .insert(courseData);

        if (insertError) throw insertError;

        result.successful++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          field: 'database',
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