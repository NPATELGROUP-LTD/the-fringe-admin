import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { data: { session }, error } = await supabaseAdmin.auth.getSession();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to get session' },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json({ session: null });
    }

    // Get admin user details
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, role, is_active, last_login_at')
      .eq('id', session.user.id)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'User not found in admin database' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          role: adminUser.role,
          is_active: adminUser.is_active,
          last_login_at: adminUser.last_login_at,
        },
        expires_at: session.expires_at,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}