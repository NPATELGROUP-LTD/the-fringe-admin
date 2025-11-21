import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { AdminUser, adminAuth } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const adminData = await adminAuth.getAdminUser(session.user.id);
        setAdminUser(adminData);
      }

      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          const adminData = await adminAuth.getAdminUser(session.user.id);
          setAdminUser(adminData);
        } else {
          setAdminUser(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (requiredRole: string): boolean => {
    if (!adminUser) return false;
    return adminAuth.hasRole(adminUser.role, requiredRole);
  };

  const canAccess = (requiredRoles: string[]): boolean => {
    if (!adminUser) return false;
    return requiredRoles.includes(adminUser.role);
  };

  return {
    user,
    adminUser,
    loading,
    hasRole,
    canAccess,
    isAuthenticated: !!user,
    isAdmin: hasRole('admin'),
    isSuperAdmin: hasRole('super_admin'),
    isEditor: hasRole('editor'),
  };
}