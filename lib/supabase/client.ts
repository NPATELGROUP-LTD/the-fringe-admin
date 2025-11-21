import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'admin-panel',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Server-side Supabase client for admin operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'admin-panel-server',
      },
    },
    db: {
      schema: 'public',
    },
  }
);

// Error handling wrapper for database operations
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
    public hint?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Utility function to handle Supabase errors
export function handleSupabaseError(error: any): DatabaseError {
  if (error?.code) {
    // Supabase specific errors
    switch (error.code) {
      case 'PGRST116':
        return new DatabaseError('Record not found', error.code, error.details, error.hint);
      case '23505':
        return new DatabaseError('Duplicate entry', error.code, error.details, error.hint);
      case '42501':
        return new DatabaseError('Insufficient permissions', error.code, error.details, error.hint);
      case 'PGRST301':
        return new DatabaseError('Row Level Security violation', error.code, error.details, error.hint);
      default:
        return new DatabaseError(error.message || 'Database operation failed', error.code, error.details, error.hint);
    }
  }

  // Network or other errors
  if (error?.message) {
    return new DatabaseError(error.message, undefined, error);
  }

  return new DatabaseError('Unknown database error', undefined, error);
}

// Retry utility for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on authentication or permission errors
      if (error?.code === '42501' || error?.code === 'PGRST301') {
        throw handleSupabaseError(error);
      }

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  throw handleSupabaseError(lastError);
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .limit(1)
      .single();

    return !error;
  } catch {
    return false;
  }
}

// Type-safe database client wrapper
export class DatabaseClient {
  private client: SupabaseClient;

  constructor(client: SupabaseClient = supabaseAdmin) {
    this.client = client;
  }

  async query<T = any>(
    table: string,
    operation: (client: SupabaseClient) => any
  ): Promise<T> {
    return withRetry(async () => {
      const result = await operation(this.client);
      const { data, error } = result;

      if (error) {
        throw handleSupabaseError(error);
      }

      return data as T;
    });
  }

  async queryList<T = any>(
    table: string,
    operation: (client: SupabaseClient) => any
  ): Promise<T[]> {
    return withRetry(async () => {
      const result = await operation(this.client);
      const { data, error } = result;

      if (error) {
        throw handleSupabaseError(error);
      }

      return data || [];
    });
  }
}

export const dbClient = new DatabaseClient();