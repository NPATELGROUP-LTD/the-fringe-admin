import { supabase } from './supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin' | 'editor';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// Authentication utilities
export const auth = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Get current user
  async getUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Reset password
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },

  // Update password
  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    return { data, error };
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Admin user utilities
export const adminAuth = {
  // Get admin user profile
  async getAdminUser(userId: string): Promise<AdminUser | null> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching admin user:', error);
      return null;
    }

    return data;
  },

  // Update last login
  async updateLastLogin(userId: string) {
    const { error } = await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating last login:', error);
    }
  },

  // Check if user has required role
  hasRole(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      editor: 1,
      admin: 2,
      super_admin: 3,
    };

    return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy];
  },
};