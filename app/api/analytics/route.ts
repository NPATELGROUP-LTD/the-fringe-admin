import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createSuccessResponse, handleApiError } from '@/lib/api/utils';

interface DateRangeRequest {
  startDate: string;
  endDate: string;
}

interface AnalyticsResponse {
  userEngagement: {
    totalContacts: number;
    totalNewsletter: number;
    totalReviews: number;
    totalTestimonials: number;
    contactTrend: number;
    newsletterTrend: number;
    reviewTrend: number;
    testimonialTrend: number;
  };
  contentPerformance: {
    courses: {
      total: number;
      active: number;
      averageRating: number;
      totalViews: number;
    };
    services: {
      total: number;
      active: number;
      averageRating: number;
      totalViews: number;
    };
    offers: {
      total: number;
      active: number;
      totalUsage: number;
      conversionRate: number;
    };
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: DateRangeRequest = await request.json();
    const { startDate, endDate } = body;

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return createSuccessResponse({ error: 'Invalid date range' }, 'Invalid date range provided', 400);
    }

    if (start > end) {
      return createSuccessResponse({ error: 'Start date must be before end date' }, 'Start date must be before end date', 400);
    }

    // Calculate previous period for trend comparison
    const periodLength = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodLength);
    const previousEnd = new Date(start.getTime() - 1);

    // Parallel queries for better performance
    const [
      // User Engagement - Current Period
      contactsCurrent,
      newsletterCurrent,
      reviewsCurrent,
      testimonialsCurrent,

      // User Engagement - Previous Period
      contactsPrevious,
      newsletterPrevious,
      reviewsPrevious,
      testimonialsPrevious,

      // Content Performance
      coursesData,
      servicesData,
      offersData,
      reviewsForCourses,
      reviewsForServices
    ] = await Promise.all([
      // Current period user engagement
      supabaseAdmin.from('contact_submissions').select('id', { count: 'exact', head: true })
        .gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabaseAdmin.from('newsletter_subscriptions').select('id', { count: 'exact', head: true })
        .gte('subscribed_at', start.toISOString()).lte('subscribed_at', end.toISOString()),
      supabaseAdmin.from('reviews').select('id', { count: 'exact', head: true })
        .gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabaseAdmin.from('testimonials').select('id', { count: 'exact', head: true })
        .gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),

      // Previous period user engagement
      supabaseAdmin.from('contact_submissions').select('id', { count: 'exact', head: true })
        .gte('created_at', previousStart.toISOString()).lte('created_at', previousEnd.toISOString()),
      supabaseAdmin.from('newsletter_subscriptions').select('id', { count: 'exact', head: true })
        .gte('subscribed_at', previousStart.toISOString()).lte('subscribed_at', previousEnd.toISOString()),
      supabaseAdmin.from('reviews').select('id', { count: 'exact', head: true })
        .gte('created_at', previousStart.toISOString()).lte('created_at', previousEnd.toISOString()),
      supabaseAdmin.from('testimonials').select('id', { count: 'exact', head: true })
        .gte('created_at', previousStart.toISOString()).lte('created_at', previousEnd.toISOString()),

      // Content performance data
      supabaseAdmin.from('courses').select('id, is_active', { count: 'exact' }),
      supabaseAdmin.from('services').select('id, is_active', { count: 'exact' }),
      supabaseAdmin.from('offers').select('id, is_active, usage_count', { count: 'exact' }),
      supabaseAdmin.from('reviews').select('course_id, rating').eq('is_approved', true),
      supabaseAdmin.from('reviews').select('course_id, rating').eq('is_approved', true).is('course_id', null)
    ]);

    // Calculate user engagement metrics
    const totalContacts = contactsCurrent.count || 0;
    const totalNewsletter = newsletterCurrent.count || 0;
    const totalReviews = reviewsCurrent.count || 0;
    const totalTestimonials = testimonialsCurrent.count || 0;

    const contactsPreviousCount = contactsPrevious.count || 0;
    const newsletterPreviousCount = newsletterPrevious.count || 0;
    const reviewsPreviousCount = reviewsPrevious.count || 0;
    const testimonialsPreviousCount = testimonialsPrevious.count || 0;

    // Calculate trends (percentage change)
    const contactTrend = contactsPreviousCount > 0
      ? ((totalContacts - contactsPreviousCount) / contactsPreviousCount) * 100
      : totalContacts > 0 ? 100 : 0;

    const newsletterTrend = newsletterPreviousCount > 0
      ? ((totalNewsletter - newsletterPreviousCount) / newsletterPreviousCount) * 100
      : totalNewsletter > 0 ? 100 : 0;

    const reviewTrend = reviewsPreviousCount > 0
      ? ((totalReviews - reviewsPreviousCount) / reviewsPreviousCount) * 100
      : totalReviews > 0 ? 100 : 0;

    const testimonialTrend = testimonialsPreviousCount > 0
      ? ((totalTestimonials - testimonialsPreviousCount) / testimonialsPreviousCount) * 100
      : totalTestimonials > 0 ? 100 : 0;

    // Content performance calculations
    const courses = coursesData.data || [];
    const totalCourses = coursesData.count || 0;
    const activeCourses = courses.filter(c => c.is_active).length;

    const services = servicesData.data || [];
    const totalServices = servicesData.count || 0;
    const activeServices = services.filter(s => s.is_active).length;

    const offers = offersData.data || [];
    const totalOffers = offersData.count || 0;
    const activeOffers = offers.filter(o => o.is_active).length;
    const totalUsage = offers.reduce((sum, o) => sum + (o.usage_count || 0), 0);

    // Calculate average ratings
    const courseReviews = reviewsForCourses.data || [];
    const coursesWithReviews = courseReviews.filter(r => r.course_id);
    const averageCourseRating = coursesWithReviews.length > 0
      ? coursesWithReviews.reduce((sum, r) => sum + r.rating, 0) / coursesWithReviews.length
      : 0;

    const serviceReviews = reviewsForServices.data || [];
    const averageServiceRating = serviceReviews.length > 0
      ? serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length
      : 0;

    // Calculate offer conversion rate (usage vs total offers shown)
    // This is a simplified calculation - in reality you'd need view tracking
    const conversionRate = totalOffers > 0 ? (totalUsage / (totalOffers * 10)) * 100 : 0; // Assuming 10 views per offer

    // Placeholder values for views (would need actual tracking implementation)
    const totalCourseViews = totalCourses * 25; // Placeholder
    const totalServiceViews = totalServices * 30; // Placeholder

    const response: AnalyticsResponse = {
      userEngagement: {
        totalContacts,
        totalNewsletter,
        totalReviews,
        totalTestimonials,
        contactTrend,
        newsletterTrend,
        reviewTrend,
        testimonialTrend
      },
      contentPerformance: {
        courses: {
          total: totalCourses,
          active: activeCourses,
          averageRating: averageCourseRating,
          totalViews: totalCourseViews
        },
        services: {
          total: totalServices,
          active: activeServices,
          averageRating: averageServiceRating,
          totalViews: totalServiceViews
        },
        offers: {
          total: totalOffers,
          active: activeOffers,
          totalUsage,
          conversionRate
        }
      },
      dateRange: {
        startDate,
        endDate
      }
    };

    return createSuccessResponse(response);

  } catch (error) {
    return handleApiError(error);
  }
}