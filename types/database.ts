// Database Types for Admin Panel
// Based on the existing 13-table schema plus admin tables

export type UUID = string;
export type Timestamp = string;

// Admin Tables
export interface AdminUser {
  id: UUID;
  email: string;
  full_name?: string;
  role: 'admin' | 'super_admin' | 'editor';
  permissions?: Record<string, any>;
  avatar_url?: string;
  last_login?: Timestamp;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AdminSession {
  id: UUID;
  admin_user_id: UUID;
  session_token: string;
  expires_at: Timestamp;
  created_at: Timestamp;
  last_activity?: Timestamp;
}

export interface AdminAuditLog {
  id: UUID;
  admin_user_id?: UUID;
  action: string;
  table_name?: string;
  record_id?: UUID;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Timestamp;
}

// Content Management Tables
export interface Course {
  id: UUID;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  duration: number;
  category_id?: UUID;
  image_url?: string;
  requirements?: Record<string, any>;
  tags?: string[];
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CourseCategory {
  id: UUID;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Service {
  id: UUID;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  duration: number;
  category_id?: UUID;
  image_url?: string;
  features?: string[];
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ServiceCategory {
  id: UUID;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Offer {
  id: UUID;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from: Timestamp;
  valid_until: Timestamp;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// User Engagement Tables
export interface ContactSubmission {
  id: UUID;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  is_read: boolean;
  responded_at?: Timestamp;
  response?: string;
  created_at: Timestamp;
}

export interface NewsletterSubscription {
  id: UUID;
  email: string;
  first_name?: string;
  last_name?: string;
  status: 'subscribed' | 'unsubscribed' | 'pending';
  subscribed_at: Timestamp;
  unsubscribed_at?: Timestamp;
  interests?: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Review {
  id: UUID;
  course_id?: UUID;
  name: string;
  email: string;
  rating: number; // 1-5
  title: string;
  content: string;
  is_approved: boolean;
  approved_at?: Timestamp;
  approved_by?: UUID;
  response?: string;
  responded_at?: Timestamp;
  responded_by?: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Testimonial {
  id: UUID;
  name: string;
  email: string;
  company?: string;
  position?: string;
  content: string;
  rating: number; // 1-5
  image_url?: string;
  is_featured: boolean;
  is_approved: boolean;
  approved_at?: Timestamp;
  approved_by?: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Content/Information Tables
export interface FAQ {
  id: UUID;
  category?: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface BusinessInfo {
  id: UUID;
  key: string;
  value: any;
  type: 'text' | 'email' | 'phone' | 'address' | 'hours' | 'social';
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface SiteSetting {
  id: UUID;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description?: string;
  is_public: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Statistic {
  id: UUID;
  key: string;
  value: number;
  label: string;
  category: string;
  period?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Database Response Types
export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
}

export interface DatabaseListResponse<T> {
  data: T[];
  error: string | null;
  count?: number;
}

// Query Parameters
export interface QueryParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Common CRUD Operations Types
export type CreateData<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateData<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

// Table Names Union
export type TableName =
  | 'admin_users'
  | 'admin_sessions'
  | 'admin_audit_log'
  | 'courses'
  | 'courses_categories'
  | 'services'
  | 'service_categories'
  | 'offers'
  | 'contact_submissions'
  | 'newsletter_subscriptions'
  | 'reviews'
  | 'testimonials'
  | 'faqs'
  | 'business_info'
  | 'site_settings'
  | 'statistics';