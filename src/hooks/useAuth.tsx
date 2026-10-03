import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import type { Profile } from '@/types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  isDemoUser: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_ID = 'demo-user-id-001';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const configured = isSupabaseConfigured();

  const fetchProfile = async (userId: string) => {
    try {
      const p = await profileService.getProfile(userId);
      setProfile(p);
    } catch (err) {
      console.warn('Could not fetch profile:', err);
    }
  };

  const enterDemoMode = () => {
    setIsDemoUser(true);
    const mockUser = {
      id: DEMO_USER_ID,
      email: 'demo@myday.app',
      app_metadata: {},
      user_metadata: { display_name: 'Alex' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User;

    setUser(mockUser);
    setProfile({
      id: DEMO_USER_ID,
      display_name: 'Alex',
      avatar_url: null,
      timezone: 'Asia/Amman',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsLoading(false);
  };

  useEffect(() => {
    if (!configured) {
      // Check if demo user was active
      const savedDemo = localStorage.getItem('my_day_demo_active');
      if (savedDemo === 'true') {
        enterDemoMode();
      } else {
        setIsLoading(false);
      }
      return;
    }

    let mounted = true;

    // Check active session
    authService.getSession().then((initialSession) => {
      if (!mounted) return;
      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [configured]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authService.signIn(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      return await authService.signUp(email, password, displayName);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    if (isDemoUser) {
      localStorage.removeItem('my_day_demo_active');
      setIsDemoUser(false);
      setUser(null);
      setProfile(null);
      return;
    }
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const updatePassword = async (password: string) => {
    await authService.updatePassword(password);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      isLoading,
      isConfigured: configured,
      isDemoUser,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
      enterDemoMode: () => {
        localStorage.setItem('my_day_demo_active', 'true');
        enterDemoMode();
      },
    }),
    [session, user, profile, isLoading, configured, isDemoUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
