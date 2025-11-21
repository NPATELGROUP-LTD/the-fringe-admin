import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/lib/auth';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  metadata: Record<string, any>;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const type = searchParams.get('type'); // Optional: filter by content type
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50 results

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: query || ''
      });
    }

    const supabase = supabaseAdmin;

    const results: SearchResult[] = [];

    // Define search queries for each content type using full-text search
    const searchQueries = [
      // Courses
      {
        type: 'course',
        query: supabase
          .from('courses')
          .select('id, title, description, slug')
          .textSearch('title', query, { type: 'websearch' })
          .eq('is_active', true)
          .limit(Math.ceil(limit / 8)) // Distribute limit across types
      },
      // Services
      {
        type: 'service',
        query: supabase
          .from('services')
          .select('id, title, description, slug')
          .textSearch('title', query, { type: 'websearch' })
          .eq('is_active', true)
          .limit(Math.ceil(limit / 8))
      },
      // Offers
      {
        type: 'offer',
        query: supabase
          .from('offers')
          .select('id, title, description')
          .textSearch('title', query, { type: 'websearch' })
          .eq('is_active', true)
          .limit(Math.ceil(limit / 8))
      },
      // FAQs
      {
        type: 'faq',
        query: supabase
          .from('faqs')
          .select('id, question, answer, category')
          .textSearch('question', query, { type: 'websearch' })
          .eq('is_active', true)
          .limit(Math.ceil(limit / 8))
      },
      // Contact Submissions
      {
        type: 'contact',
        query: supabase
          .from('contact_submissions')
          .select('id, name, email, subject, message')
          .textSearch('name', query, { type: 'websearch' })
          .limit(Math.ceil(limit / 8))
      },
      // Newsletter Subscriptions
      {
        type: 'newsletter',
        query: supabase
          .from('newsletter_subscriptions')
          .select('id, email, first_name, last_name')
          .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
          .eq('status', 'subscribed')
          .limit(Math.ceil(limit / 8))
      },
      // Reviews
      {
        type: 'review',
        query: supabase
          .from('reviews')
          .select('id, name, email, title, content')
          .textSearch('name', query, { type: 'websearch' })
          .limit(Math.ceil(limit / 8))
      },
      // Testimonials
      {
        type: 'testimonial',
        query: supabase
          .from('testimonials')
          .select('id, name, email, company, content')
          .textSearch('name', query, { type: 'websearch' })
          .eq('is_approved', true)
          .limit(Math.ceil(limit / 8))
      }
    ];

    // Execute searches based on type filter
    const queriesToExecute = type
      ? searchQueries.filter(q => q.type === type)
      : searchQueries;

    const queryPromises = queriesToExecute.map(async ({ type: resultType, query: dbQuery }) => {
      const { data, error } = await dbQuery;
      if (error) {
        console.error(`Search error for ${resultType}:`, error);
        return [];
      }

      return (data || []).map((item: any) => {
        let title = '';
        let description = '';
        let url = '';
        const metadata: Record<string, any> = {};

        switch (resultType) {
          case 'course':
            title = item.title;
            description = item.description?.substring(0, 150) + '...';
            url = `/admin/content/courses`;
            metadata.slug = item.slug;
            break;
          case 'service':
            title = item.title;
            description = item.description?.substring(0, 150) + '...';
            url = `/admin/content/services`;
            metadata.slug = item.slug;
            break;
          case 'offer':
            title = item.title;
            description = item.description?.substring(0, 150) + '...';
            url = `/admin/content/offers`;
            break;
          case 'faq':
            title = item.question;
            description = item.answer?.substring(0, 150) + '...';
            url = `/admin/content/faqs`;
            metadata.category = item.category;
            break;
          case 'contact':
            title = `${item.name} - ${item.subject}`;
            description = item.message?.substring(0, 150) + '...';
            url = `/admin/engagement/contacts`;
            metadata.email = item.email;
            break;
          case 'newsletter':
            title = `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email;
            description = item.email;
            url = `/admin/engagement/newsletter`;
            break;
          case 'review':
            title = `${item.name} - ${item.title}`;
            description = item.content?.substring(0, 150) + '...';
            url = `/admin/engagement/reviews`;
            metadata.rating = item.rating;
            break;
          case 'testimonial':
            title = `${item.name}${item.company ? ` (${item.company})` : ''}`;
            description = item.content?.substring(0, 150) + '...';
            url = `/admin/engagement/testimonials`;
            metadata.rating = item.rating;
            break;
        }

        return {
          id: item.id,
          type: resultType,
          title,
          description,
          url,
          metadata
        };
      });
    });

    const queryResults = await Promise.all(queryPromises);

    // Flatten and limit results
    const allResults = queryResults.flat();
    const limitedResults = allResults.slice(0, limit);

    return NextResponse.json({
      results: limitedResults,
      total: allResults.length,
      query,
      type: type || 'all'
    });

  } catch (error) {
    console.error('Global search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}