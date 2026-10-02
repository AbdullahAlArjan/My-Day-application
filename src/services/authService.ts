import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

export const authService = {
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Error fetching Supabase session:', error.message);
      return null;
    }
    return data.session;
  },

  async getUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async signUp(email: string, password: string, displayName?: string) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please add your credentials.');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || '',
          full_name: displayName || '',
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please add your credentials.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signInWithOtp(email: string) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please add your credentials.');
    }
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please add your credentials.');
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword: string) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please add your credentials.');
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    if (!isSupabaseConfigured()) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};
