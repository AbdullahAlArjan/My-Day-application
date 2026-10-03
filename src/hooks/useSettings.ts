import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settingsService';
import { useAuth } from './useAuth';
import type { UserSettings } from '@/types/database';
import { useEffect } from 'react';
import { applyTheme, applyAccentColor } from '@/lib/theme';

const DEFAULT_SETTINGS: UserSettings = {
  user_id: 'local',
  theme: 'system',
  accent_color: 'indigo',
  default_priority: 'medium',
  first_day_of_week: 1,
  time_format: '12h',
  show_completed_tasks: true,
  default_home_view: 'list',
  animations_enabled: true,
  confirm_before_delete: true,
  updated_at: new Date().toISOString(),
};

function getLocalSettings(): UserSettings {
  try {
    const saved = localStorage.getItem('my_day_local_settings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function useSettings() {
  const { user, isDemoUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ['settings', userId || 'guest'],
    queryFn: async (): Promise<UserSettings> => {
      const local = getLocalSettings();
      if (!userId || isDemoUser) {
        return local;
      }
      try {
        const remote = await settingsService.getSettings(userId);
        if (remote) {
          localStorage.setItem('my_day_local_settings', JSON.stringify(remote));
          return remote;
        }
        return local;
      } catch (err) {
        console.warn('Backend getSettings failed, using local settings:', err);
        return local;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const settings = query.data || getLocalSettings();

  useEffect(() => {
    if (settings) {
      applyTheme(settings.theme);
      applyAccentColor(settings.accent_color);
    }
  }, [settings.theme, settings.accent_color]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<UserSettings, 'user_id' | 'updated_at'>>) => {
      const current = query.data || getLocalSettings();
      const updated: UserSettings = {
        ...current,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Always save locally for instant response & offline resilience
      localStorage.setItem('my_day_local_settings', JSON.stringify(updated));

      if (userId && !isDemoUser) {
        try {
          return await settingsService.updateSettings(userId, updates);
        } catch (err) {
          console.warn('Cloud update failed, stored in localStorage:', err);
          return updated;
        }
      }
      return updated;
    },
    onMutate: async (newUpdates) => {
      // 1. Immediately apply visual theme changes with 0ms delay!
      if (newUpdates.theme) {
        applyTheme(newUpdates.theme);
      }
      if (newUpdates.accent_color) {
        applyAccentColor(newUpdates.accent_color);
      }

      // 2. Optimistically update React Query cache
      const cacheKey = ['settings', userId || 'guest'];
      await queryClient.cancelQueries({ queryKey: cacheKey });
      const previous = queryClient.getQueryData<UserSettings>(cacheKey) || getLocalSettings();
      const optimistic: UserSettings = {
        ...previous,
        ...newUpdates,
        updated_at: new Date().toISOString(),
      };
      queryClient.setQueryData<UserSettings>(cacheKey, optimistic);

      return { previous, cacheKey };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.cacheKey, context.previous);
        applyTheme(context.previous.theme);
        applyAccentColor(context.previous.accent_color);
      }
    },
    onSettled: (_data, _error, _variables, context) => {
      const cacheKey = context?.cacheKey || ['settings', userId || 'guest'];
      queryClient.invalidateQueries({ queryKey: cacheKey });
    },
  });

  return {
    settings,
    isLoading: query.isLoading,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
