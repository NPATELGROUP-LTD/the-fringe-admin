import { NextResponse } from 'next/server';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Create standardized API response
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success,
    ...(data !== undefined && { data }),
    ...(error && { error }),
    ...(message && { message }),
  };

  return NextResponse.json(response, { status: statusCode });
}

// Create success response
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK
): NextResponse<ApiResponse<T>> {
  return createApiResponse(true, data, undefined, message, statusCode);
}

// Create error response
export function createErrorResponse(
  error: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message?: string
): NextResponse<ApiResponse> {
  return createApiResponse(false, undefined, error, message, statusCode);
}

// Validate required fields in request body
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => !body[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

// Handle API errors consistently
export function handleApiError(error: any): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return createErrorResponse(error.message, error.statusCode, error.code);
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return createErrorResponse(
      'Validation failed',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      error.message
    );
  }

  // Handle database errors
  if (error.name === 'DatabaseError') {
    return createErrorResponse(
      'Database operation failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }

  // Handle authentication errors
  if (error.message?.includes('JWT') || error.message?.includes('auth')) {
    return createErrorResponse(
      'Authentication failed',
      HTTP_STATUS.UNAUTHORIZED,
      error.message
    );
  }

  // Default error response
  return createErrorResponse(
    'An unexpected error occurred',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    error.message || 'Unknown error'
  );
}

// Rate limiting helper (basic implementation)
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(private maxRequests: number = 100, private windowMs: number = 60000) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [now]);
      return true;
    }

    const userRequests = this.requests.get(identifier)!;
    const recentRequests = userRequests.filter(time => time > windowStart);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

// CORS headers for API responses
export function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const defaultOrigin = allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin || '') ? (origin || defaultOrigin) : defaultOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Handle OPTIONS requests for CORS
export function handleOptionsRequest(origin?: string): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(origin),
  });
}