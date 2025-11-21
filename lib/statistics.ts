import { supabaseAdmin } from './supabase/client';

export interface StatisticUpdate {
  key: string;
  value: number;
  label: string;
  category: string;
  period?: string;
}

export interface StatisticIncrement {
  key: string;
  increment: number;
  period?: string;
}

/**
 * Statistics tracking utility for real-time metrics
 */
export class StatisticsTracker {
  /**
   * Update or create a statistic
   */
  static async updateStatistic(update: StatisticUpdate): Promise<void> {
    try {
      const period = update.period || 'current';

      // Check if statistic exists
      const { data: existing } = await supabaseAdmin
        .from('statistics')
        .select('id')
        .eq('key', update.key)
        .eq('period', period)
        .single();

      if (existing) {
        // Update existing
        await supabaseAdmin
          .from('statistics')
          .update({
            value: update.value,
            label: update.label,
            category: update.category,
            updated_at: new Date().toISOString()
          })
          .eq('key', update.key)
          .eq('period', period);
      } else {
        // Create new
        await supabaseAdmin
          .from('statistics')
          .insert({
            key: update.key,
            value: update.value,
            label: update.label,
            category: update.category,
            period
          });
      }
    } catch (error) {
      console.error('Failed to update statistic:', error);
    }
  }

  /**
   * Increment a statistic value
   */
  static async incrementStatistic(increment: StatisticIncrement): Promise<void> {
    try {
      const period = increment.period || 'current';

      // Get current value
      const { data: existing } = await supabaseAdmin
        .from('statistics')
        .select('value')
        .eq('key', increment.key)
        .eq('period', period)
        .single();

      const newValue = (existing?.value || 0) + increment.increment;

      await supabaseAdmin
        .from('statistics')
        .upsert({
          key: increment.key,
          value: newValue,
          period
        }, {
          onConflict: 'key,period'
        });
    } catch (error) {
      console.error('Failed to increment statistic:', error);
    }
  }

  /**
   * Bulk update multiple statistics
   */
  static async bulkUpdateStatistics(updates: StatisticUpdate[]): Promise<void> {
    try {
      const promises = updates.map(update => this.updateStatistic(update));
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to bulk update statistics:', error);
    }
  }

  /**
   * Track user engagement metrics
   */
  static async trackUserEngagement(): Promise<void> {
    try {
      // Get current counts
      const [
        { count: contactCount },
        { count: newsletterCount },
        { count: reviewCount },
        { count: testimonialCount }
      ] = await Promise.all([
        supabaseAdmin.from('contact_submissions').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('newsletter_subscriptions').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('testimonials').select('*', { count: 'exact', head: true })
      ]);

      await this.bulkUpdateStatistics([
        {
          key: 'total_contacts',
          value: contactCount || 0,
          label: 'Total Contact Submissions',
          category: 'user_engagement'
        },
        {
          key: 'total_newsletter_subscribers',
          value: newsletterCount || 0,
          label: 'Total Newsletter Subscribers',
          category: 'user_engagement'
        },
        {
          key: 'total_reviews',
          value: reviewCount || 0,
          label: 'Total Reviews',
          category: 'user_engagement'
        },
        {
          key: 'total_testimonials',
          value: testimonialCount || 0,
          label: 'Total Testimonials',
          category: 'user_engagement'
        }
      ]);
    } catch (error) {
      console.error('Failed to track user engagement:', error);
    }
  }

  /**
   * Track content performance metrics
   */
  static async trackContentPerformance(): Promise<void> {
    try {
      // Get content counts
      const [
        { count: courseCount },
        { count: serviceCount },
        { count: offerCount }
      ] = await Promise.all([
        supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('services').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('offers').select('*', { count: 'exact', head: true })
      ]);

      // Get active content
      const [
        { data: activeCourses },
        { data: activeServices },
        { data: activeOffers }
      ] = await Promise.all([
        supabaseAdmin.from('courses').select('id').eq('is_active', true),
        supabaseAdmin.from('services').select('id').eq('is_active', true),
        supabaseAdmin.from('offers').select('id').eq('is_active', true)
      ]);

      await this.bulkUpdateStatistics([
        {
          key: 'total_courses',
          value: courseCount || 0,
          label: 'Total Courses',
          category: 'content'
        },
        {
          key: 'active_courses',
          value: activeCourses?.length || 0,
          label: 'Active Courses',
          category: 'content'
        },
        {
          key: 'total_services',
          value: serviceCount || 0,
          label: 'Total Services',
          category: 'content'
        },
        {
          key: 'active_services',
          value: activeServices?.length || 0,
          label: 'Active Services',
          category: 'content'
        },
        {
          key: 'total_offers',
          value: offerCount || 0,
          label: 'Total Offers',
          category: 'content'
        },
        {
          key: 'active_offers',
          value: activeOffers?.length || 0,
          label: 'Active Offers',
          category: 'content'
        }
      ]);
    } catch (error) {
      console.error('Failed to track content performance:', error);
    }
  }

  /**
   * Track performance metrics (response times, etc.)
   */
  static async trackPerformanceMetrics(): Promise<void> {
    try {
      // This would typically track API response times, page load times, etc.
      // For now, we'll track basic system metrics
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      await this.updateStatistic({
        key: 'system_uptime',
        value: 1, // Simple uptime indicator
        label: 'System Uptime',
        category: 'performance',
        period: today
      });
    } catch (error) {
      console.error('Failed to track performance metrics:', error);
    }
  }

  /**
   * Initialize default statistics
   */
  static async initializeStatistics(): Promise<void> {
    try {
      await Promise.all([
        this.trackUserEngagement(),
        this.trackContentPerformance(),
        this.trackPerformanceMetrics()
      ]);
    } catch (error) {
      console.error('Failed to initialize statistics:', error);
    }
  }
}