import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
      },
    }
  );

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !pathname.startsWith('/admin/forgot-password') && !pathname.startsWith('/admin/reset-password')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // Check if user has admin role
    try {
      const { data: adminUser, error } = await supabaseAdmin
        .from('admin_users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !adminUser) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }

      // Allow access if user has any admin role (editor, admin, super_admin)
      const allowedRoles = ['editor', 'admin', 'super_admin'];
      if (!allowedRoles.includes(adminUser.role)) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // Redirect logged-in users away from login page
  if ((pathname === '/admin/login' || pathname === '/admin/forgot-password') && session) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};