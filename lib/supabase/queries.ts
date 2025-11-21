import { supabaseAdmin, dbClient, handleSupabaseError } from './client';
import type {
  DatabaseResponse,
  DatabaseListResponse,
  QueryParams,
  TableName,
  UUID,
  AdminUser,
  Course,
  Service,
  Offer,
  ContactSubmission,
  NewsletterSubscription,
  Review,
  Testimonial,
  FAQ,
  BusinessInfo,
  SiteSetting,
  Statistic,
  CourseCategory,
  ServiceCategory,
  AdminAuditLog,
} from '../../types/database';

// Generic CRUD operations
export class DatabaseQueries {
  // Generic SELECT operations
  static async findById<T>(
    table: TableName,
    id: UUID
  ): Promise<DatabaseResponse<T>> {
    try {
      const data = await dbClient.query<T>(table, (client) =>
        client.from(table).select('*').eq('id', id).single()
      );

      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error).message };
    }
  }

  static async findMany<T>(
    table: TableName,
    params: QueryParams = {}
  ): Promise<DatabaseListResponse<T>> {
    try {
      let query = supabaseAdmin.from(table).select('*', { count: 'exact' });

      // Apply filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (params.orderBy) {
        query = query.order(params.orderBy, {
          ascending: params.orderDirection !== 'desc'
        });
      }

      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }
      if (params.offset) {
        query = query.range(params.offset, (params.offset + (params.limit || 10)) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data: data || [], error: null, count: count || 0 };
    } catch (error) {
      return { data: [], error: handleSupabaseError(error).message };
    }
  }

  static async create<T>(
    table: TableName,
    data: Partial<T>
  ): Promise<DatabaseResponse<T>> {
    try {
      const result = await dbClient.query<T>(table, (client) =>
        client.from(table).insert(data).select().single()
      );

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error).message };
    }
  }

  static async update<T>(
    table: TableName,
    id: UUID,
    data: Partial<T>
  ): Promise<DatabaseResponse<T>> {
    try {
      const result = await dbClient.query<T>(table, (client) =>
        client.from(table).update(data).eq('id', id).select().single()
      );

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error).message };
    }
  }

  static async delete(
    table: TableName,
    id: UUID
  ): Promise<DatabaseResponse<boolean>> {
    try {
      await dbClient.query(table, (client) =>
        client.from(table).delete().eq('id', id)
      );

      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: handleSupabaseError(error).message };
    }
  }

  static async softDelete(
    table: TableName,
    id: UUID
  ): Promise<DatabaseResponse<boolean>> {
    try {
      await dbClient.query(table, (client) =>
        client.from(table).update({ is_active: false }).eq('id', id)
      );

      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: handleSupabaseError(error).message };
    }
  }

  // Bulk operations
  static async bulkUpdate<T>(
    table: TableName,
    updates: Array<{ id: UUID; data: Partial<T> }>
  ): Promise<DatabaseResponse<boolean>> {
    try {
      const promises = updates.map(({ id, data }) =>
        dbClient.query(table, (client) =>
          client.from(table).update(data).eq('id', id)
        )
      );

      await Promise.all(promises);
      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: handleSupabaseError(error).message };
    }
  }

  static async bulkDelete(
    table: TableName,
    ids: UUID[]
  ): Promise<DatabaseResponse<boolean>> {
    try {
      await dbClient.query(table, (client) =>
        client.from(table).delete().in('id', ids)
      );

      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: handleSupabaseError(error).message };
    }
  }
}

// Specific table queries with business logic

// Admin Users
export const adminUserQueries = {
  findByEmail: (email: string) =>
    DatabaseQueries.findById<AdminUser>('admin_users', email),

  findActive: () =>
    DatabaseQueries.findMany<AdminUser>('admin_users', {
      filters: { is_active: true },
      orderBy: 'created_at',
      orderDirection: 'desc'
    }),

  updateLastLogin: (id: UUID) =>
    DatabaseQueries.update<AdminUser>('admin_users', id, {
      last_login: new Date().toISOString()
    }),

  createAuditLog: (data: Omit<AdminAuditLog, 'id' | 'created_at'>) =>
    DatabaseQueries.create<AdminAuditLog>('admin_audit_log', data),
};

// Courses
export const courseQueries = {
  findActive: () =>
    DatabaseQueries.findMany<Course>('courses', {
      filters: { is_active: true },
      orderBy: 'created_at',
      orderDirection: 'desc'
    }),

  findByCategory: (categoryId: UUID) =>
    DatabaseQueries.findMany<Course>('courses', {
      filters: { category_id: categoryId, is_active: true },
      orderBy: 'title'
    }),

  search: (query: string) =>
    DatabaseQueries.findMany<Course>('courses', {
      filters: { is_active: true }
    }).then(result => ({
      ...result,
      data: result.data.filter(course =>
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.description.toLowerCase().includes(query.toLowerCase())
      )
    })),
};

// Services
export const serviceQueries = {
  findActive: () =>
    DatabaseQueries.findMany<Service>('services', {
      filters: { is_active: true },
      orderBy: 'created_at',
      orderDirection: 'desc'
    }),

  findByCategory: (categoryId: UUID) =>
    DatabaseQueries.findMany<Service>('services', {
      filters: { category_id: categoryId, is_active: true },
      orderBy: 'title'
    }),
};

// Offers
export const offerQueries = {
  findActive: () => {
    const now = new Date().toISOString();
    return DatabaseQueries.findMany<Offer>('offers', {
      filters: {
        is_active: true,
        valid_from: { lte: now },
        valid_until: { gte: now }
      },
      orderBy: 'created_at',
      orderDirection: 'desc'
    });
  },

  incrementUsage: (id: UUID) =>
    supabaseAdmin.rpc('increment_offer_usage', { offer_id: id }),
};

// Contact Submissions
export const contactQueries = {
  findUnread: () =>
    DatabaseQueries.findMany<ContactSubmission>('contact_submissions', {
      filters: { is_read: false },
      orderBy: 'created_at',
      orderDirection: 'desc'
    }),

  markAsRead: (id: UUID) =>
    DatabaseQueries.update<ContactSubmission>('contact_submissions', id, {
      is_read: true,
      responded_at: new Date().toISOString()
    }),
};

// Newsletter Subscriptions
export const newsletterQueries = {
  findActive: () =>
    DatabaseQueries.findMany<NewsletterSubscription>('newsletter_subscriptions', {
      filters: { status: 'subscribed' },
      orderBy: 'subscribed_at',
      orderDirection: 'desc'
    }),

  unsubscribe: (email: string) =>
    DatabaseQueries.update<NewsletterSubscription>('newsletter_subscriptions', email, {
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString()
    }),
};

// Reviews
export const reviewQueries = {
  findPending: () =>
    DatabaseQueries.findMany<Review>('reviews', {
      filters: { is_approved: false },
      orderBy: 'created_at',
      orderDirection: 'desc'
    }),

  approve: (id: UUID, approvedBy: UUID) =>
    DatabaseQueries.update<Review>('reviews', id, {
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: approvedBy
    }),
};

// Testimonials
export const testimonialQueries = {
  findApproved: () =>
    DatabaseQueries.findMany<Testimonial>('testimonials', {
      filters: { is_approved: true },
      orderBy: 'created_at',
      orderDirection: 'desc'
    }),

  findFeatured: () =>
    DatabaseQueries.findMany<Testimonial>('testimonials', {
      filters: { is_featured: true, is_approved: true },
      orderBy: 'created_at',
      orderDirection: 'desc'
    }),
};

// FAQs
export const faqQueries = {
  findActive: () =>
    DatabaseQueries.findMany<FAQ>('faqs', {
      filters: { is_active: true },
      orderBy: 'sort_order'
    }),

  findByCategory: (category: string) =>
    DatabaseQueries.findMany<FAQ>('faqs', {
      filters: { category, is_active: true },
      orderBy: 'sort_order'
    }),
};

// Business Info
export const businessInfoQueries = {
  findActive: () =>
    DatabaseQueries.findMany<BusinessInfo>('business_info', {
      filters: { is_active: true },
      orderBy: 'key'
    }),

  findByType: (type: BusinessInfo['type']) =>
    DatabaseQueries.findMany<BusinessInfo>('business_info', {
      filters: { type, is_active: true },
      orderBy: 'key'
    }),
};

// Site Settings
export const siteSettingQueries = {
  findPublic: () =>
    DatabaseQueries.findMany<SiteSetting>('site_settings', {
      filters: { is_public: true },
      orderBy: 'category'
    }),

  findByCategory: (category: string) =>
    DatabaseQueries.findMany<SiteSetting>('site_settings', {
      filters: { category },
      orderBy: 'key'
    }),

  findByKey: (key: string) =>
    DatabaseQueries.findById<SiteSetting>('site_settings', key),
};

// Statistics
export const statisticQueries = {
  findByCategory: (category: string) =>
    DatabaseQueries.findMany<Statistic>('statistics', {
      filters: { category },
      orderBy: 'created_at',
      orderDirection: 'desc'
    }),

  findLatest: () =>
    DatabaseQueries.findMany<Statistic>('statistics', {
      orderBy: 'created_at',
      orderDirection: 'desc',
      limit: 50
    }),
};

// Categories
export const categoryQueries = {
  findCourseCategories: () =>
    DatabaseQueries.findMany<CourseCategory>('courses_categories', {
      filters: { is_active: true },
      orderBy: 'sort_order'
    }),

  findServiceCategories: () =>
    DatabaseQueries.findMany<ServiceCategory>('service_categories', {
      filters: { is_active: true },
      orderBy: 'sort_order'
    }),
};

// Export all query modules
export const dbQueries = {
  adminUsers: adminUserQueries,
  courses: courseQueries,
  services: serviceQueries,
  offers: offerQueries,
  contacts: contactQueries,
  newsletters: newsletterQueries,
  reviews: reviewQueries,
  testimonials: testimonialQueries,
  faqs: faqQueries,
  businessInfo: businessInfoQueries,
  siteSettings: siteSettingQueries,
  statistics: statisticQueries,
  categories: categoryQueries,
};