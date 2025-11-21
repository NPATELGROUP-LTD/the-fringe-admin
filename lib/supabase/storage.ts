import { supabaseAdmin } from './client';

// Storage configuration
export const STORAGE_BUCKETS = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  TEMP: 'temp',
} as const;

export const FOLDER_STRUCTURE = {
  COURSES: 'courses',
  SERVICES: 'services',
  OFFERS: 'offers',
  BUSINESS_INFO: 'business-info',
  TESTIMONIALS: 'testimonials',
  REVIEWS: 'reviews',
  EMAIL_TEMPLATES: 'email-templates',
  TEMP: 'temp',
} as const;

// File validation constants
export const FILE_CONSTRAINTS = {
  MAX_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    VIDEO: 50 * 1024 * 1024, // 50MB
  },
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as string[],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as string[],
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg'] as string[],
  },
} as const;

// Initialize storage buckets (call this during app initialization)
export async function initializeStorageBuckets() {
  try {
    // Check if buckets exist, create if not
    for (const bucketName of Object.values(STORAGE_BUCKETS)) {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

      if (!bucketExists) {
        const { error } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: bucketName === STORAGE_BUCKETS.PUBLIC,
          allowedMimeTypes: [
            ...FILE_CONSTRAINTS.ALLOWED_TYPES.IMAGE,
            ...FILE_CONSTRAINTS.ALLOWED_TYPES.DOCUMENT,
            ...FILE_CONSTRAINTS.ALLOWED_TYPES.VIDEO,
          ],
          fileSizeLimit: FILE_CONSTRAINTS.MAX_SIZE.VIDEO,
        });

        if (error) {
          console.error(`Failed to create bucket ${bucketName}:`, error);
        } else {
          console.log(`Created storage bucket: ${bucketName}`);
        }
      }
    }
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
  }
}

// Generate organized file path
export function generateFilePath(
  folder: string,
  originalName: string,
  prefix?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension

  // Sanitize filename
  const sanitizedName = baseName
    .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remove special chars except -_
    .replace(/\s+/g, '-') // Replace spaces with -
    .substring(0, 50); // Limit length

  const fileName = prefix
    ? `${prefix}-${timestamp}-${random}-${sanitizedName}.${extension}`
    : `${timestamp}-${random}-${sanitizedName}.${extension}`;

  return `${folder}/${fileName}`;
}

// Validate file
export function validateFile(
  file: File,
  type: 'image' | 'document' | 'video' = 'image'
): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = FILE_CONSTRAINTS.ALLOWED_TYPES[type.toUpperCase() as keyof typeof FILE_CONSTRAINTS.ALLOWED_TYPES];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  const maxSize = FILE_CONSTRAINTS.MAX_SIZE[type.toUpperCase() as keyof typeof FILE_CONSTRAINTS.MAX_SIZE];
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds limit. Maximum size: ${maxSize / (1024 * 1024)}MB`
    };
  }

  // Check filename safety
  const fileName = file.name;
  if (fileName.length > 255) {
    return {
      valid: false,
      error: 'Filename is too long'
    };
  }

  // Check for malicious patterns
  const maliciousPatterns = [
    /\.\./,  // Directory traversal
    /^[.-]/, // Hidden files
    /[<>:"|?*\x00-\x1f]/, // Invalid characters
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(fileName)) {
      return {
        valid: false,
        error: 'Invalid filename'
      };
    }
  }

  return { valid: true };
}

// Upload file with organization
export async function uploadFile(
  file: File,
  bucket: string = STORAGE_BUCKETS.PUBLIC,
  folder: string = FOLDER_STRUCTURE.TEMP,
  options?: {
    prefix?: string;
    upsert?: boolean;
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate organized path
    const filePath = generateFilePath(folder, file.name, options?.prefix);

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: options?.upsert || false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: 'Failed to upload file' };
    }

    // Get public URL if public bucket
    let publicUrl: string | undefined;
    if (bucket === STORAGE_BUCKETS.PUBLIC) {
      const { data: urlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(filePath);
      publicUrl = urlData.publicUrl;
    }

    return {
      success: true,
      data: {
        path: filePath,
        url: publicUrl,
        bucket,
        size: file.size,
        type: file.type,
      }
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Upload failed' };
  }
}

// Delete file
export async function deleteFile(
  path: string,
  bucket: string = STORAGE_BUCKETS.PUBLIC
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: 'Failed to delete file' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: 'Delete failed' };
  }
}

// Get file metadata
export async function getFileMetadata(
  path: string,
  bucket: string = STORAGE_BUCKETS.PUBLIC
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop(),
      });

    if (error) {
      return { success: false, error: 'Failed to get file metadata' };
    }

    const file = data?.find(f => f.name === path.split('/').pop());
    if (!file) {
      return { success: false, error: 'File not found' };
    }

    return { success: true, data: file };
  } catch (error) {
    return { success: false, error: 'Metadata retrieval failed' };
  }
}