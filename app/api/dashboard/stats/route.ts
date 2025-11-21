import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createSuccessResponse, handleApiError } from '@/lib/api/utils';

interface CampaignData {
  id: string;
  status: string;
  sent_count: number;
}

interface ContactData {
  id: string;
  name: string;
  subject: string;
  created_at: string;
}

interface ReviewData {
  id: string;
  name: string;
  title: string;
  created_at: string;
}

interface TestimonialData {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {

    // Get current month start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get last month for comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Parallel queries for better performance
    const [
      coursesResult,
      servicesResult,
      contactsResult,
      newsletterResult,
      reviewsResult,
      testimonialsResult,
      offersResult,
      campaignsResult,
      recentContacts,
      recentReviews,
      recentTestimonials,
      monthlyContacts,
      lastMonthContacts,
      monthlyNewsletter,
      lastMonthNewsletter
    ] = await Promise.all([
      // Basic counts
      supabaseAdmin.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('services').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('contact_submissions').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('newsletter_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'subscribed'),
      supabaseAdmin.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', true),
      supabaseAdmin.from('testimonials').select('id', { count: 'exact', head: true }).eq('is_approved', true),
      supabaseAdmin.from('offers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('email_campaigns').select('id, status, sent_count', { count: 'exact' }),

      // Recent activity (last 10)
      supabaseAdmin.from('contact_submissions').select('id, name, subject, created_at').order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('reviews').select('id, name, title, created_at').eq('is_approved', true).order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('testimonials').select('id, name, content, created_at').eq('is_approved', true).order('created_at', { ascending: false }).limit(10),

      // Monthly trends
      supabaseAdmin.from('contact_submissions').select('id', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()).lte('created_at', monthEnd.toISOString()),
      supabaseAdmin.from('contact_submissions').select('id', { count: 'exact', head: true }).gte('created_at', lastMonthStart.toISOString()).lte('created_at', lastMonthEnd.toISOString()),
      supabaseAdmin.from('newsletter_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'subscribed').gte('subscribed_at', monthStart.toISOString()).lte('subscribed_at', monthEnd.toISOString()),
      supabaseAdmin.from('newsletter_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'subscribed').gte('subscribed_at', lastMonthStart.toISOString()).lte('subscribed_at', lastMonthEnd.toISOString())
    ]);

    // Calculate totals
    const totalCourses = coursesResult.count || 0;
    const totalServices = servicesResult.count || 0;
    const totalContacts = contactsResult.count || 0;
    const totalNewsletter = newsletterResult.count || 0;
    const totalReviews = reviewsResult.count || 0;
    const totalTestimonials = testimonialsResult.count || 0;
    const totalOffers = offersResult.count || 0;

    // Email campaign stats
    const campaigns: CampaignData[] = campaignsResult.data || [];
    const totalCampaigns = campaignsResult.count || 0;
    const sentCampaigns = campaigns.filter((c: CampaignData) => c.status === 'sent').length;
    const totalEmailsSent = campaigns.reduce((sum: number, c: CampaignData) => sum + (c.sent_count || 0), 0);

    // Recent activity
    const recentActivity = [
      ...(recentContacts.data as ContactData[] || []).map((c: ContactData) => ({
        type: 'contact',
        title: `New contact: ${c.name}`,
        subtitle: c.subject,
        timestamp: c.created_at
      })),
      ...(recentReviews.data as ReviewData[] || []).map((r: ReviewData) => ({
        type: 'review',
        title: `New review: ${r.title}`,
        subtitle: `By ${r.name}`,
        timestamp: r.created_at
      })),
      ...(recentTestimonials.data as TestimonialData[] || []).map((t: TestimonialData) => ({
        type: 'testimonial',
        title: 'New testimonial',
        subtitle: `By ${t.name}`,
        timestamp: t.created_at
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    // Trends
    const monthlyContactsCount = monthlyContacts.count || 0;
    const lastMonthContactsCount = lastMonthContacts.count || 0;
    const monthlyNewsletterCount = monthlyNewsletter.count || 0;
    const lastMonthNewsletterCount = lastMonthNewsletter.count || 0;

    const contactsTrend = lastMonthContactsCount > 0
      ? ((monthlyContactsCount - lastMonthContactsCount) / lastMonthContactsCount) * 100
      : monthlyContactsCount > 0 ? 100 : 0;

    const newsletterTrend = lastMonthNewsletterCount > 0
      ? ((monthlyNewsletterCount - lastMonthNewsletterCount) / lastMonthNewsletterCount) * 100
      : monthlyNewsletterCount > 0 ? 100 : 0;

    // Revenue trends (placeholder - would need actual sales data)
    const revenueTrend = 0; // Placeholder
    const bookingTrend = contactsTrend; // Using contacts as proxy for bookings

    return createSuccessResponse({
      statistics: {
        totalCourses,
        totalServices,
        totalContacts,
        totalNewsletter,
        totalReviews,
        totalTestimonials,
        totalOffers,
        totalCampaigns,
        sentCampaigns,
        totalEmailsSent
      },
      recentActivity,
      trends: {
        contacts: {
          current: monthlyContactsCount,
          previous: lastMonthContactsCount,
          change: contactsTrend
        },
        newsletter: {
          current: monthlyNewsletterCount,
          previous: lastMonthNewsletterCount,
          change: newsletterTrend
        },
        revenue: {
          current: 0, // Placeholder
          previous: 0,
          change: revenueTrend
        },
        bookings: {
          current: monthlyContactsCount,
          previous: lastMonthContactsCount,
          change: bookingTrend
        }
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}