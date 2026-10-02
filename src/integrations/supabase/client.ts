import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const LOCAL_STORAGE_KEY_URL = 'my_day_supabase_url';
const LOCAL_STORAGE_KEY_ANON = 'my_day_supabase_anon_key';

// Read from Vite environment variables first, then fallback to user-entered development override
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const localOverrideUrl = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_URL) : null;
const localOverrideAnonKey = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_ANON) : null;

export const supabaseUrl = (localOverrideUrl || envUrl || '').trim();
export const supabaseAnonKey = (localOverrideAnonKey || envAnonKey || '').trim();

export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl === 'your_supabase_project_url' || supabaseAnonKey === 'your_supabase_publishable_or_anon_key') {
    return false;
  }
  return supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://');
};

// Fallback dummy URL and key to prevent createClient throwing immediately if unconfigured at boot
const activeUrl = isSupabaseConfigured() ? supabaseUrl : 'https://dummy-placeholder.supabase.co';
const activeAnonKey = isSupabaseConfigured() ? supabaseAnonKey : 'dummy-placeholder-key';

export const supabase = createClient<any>(activeUrl, activeAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const updateSupabaseCredentials = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY_URL, url.trim());
    localStorage.setItem(LOCAL_STORAGE_KEY_ANON, anonKey.trim());
    window.location.reload();
  }
};

export const clearSupabaseCredentialsOverride = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY_URL);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ANON);
    window.location.reload();
  }
};
