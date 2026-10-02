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

export function useSettings() {
  const { user, isDemoUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ['settings', userId],
    queryFn: async (): Promise<UserSettings> => {
      if (!userId || isDemoUser) {
        const saved = localStorage.getItem('my_day_local_settings');
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch {
            return DEFAULT_SETTINGS;
          }
        }
        return DEFAULT_SETTINGS;
      }
      return settingsService.getSettings(userId);
    },
    enabled: !!userId,
  });

  const settings = query.data || DEFAULT_SETTINGS;

  useEffect(() => {
    if (settings) {
      applyTheme(settings.theme);
      applyAccentColor(settings.accent_color);
    }
  }, [settings.theme, settings.accent_color]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<UserSettings, 'user_id' | 'updated_at'>>) => {
      if (!userId || isDemoUser) {
        const updated = { ...settings, ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem('my_day_local_settings', JSON.stringify(updated));
        return updated;
      }
      return settingsService.updateSettings(userId, updates);
    },
    onMutate: async (newUpdates) => {
      await queryClient.cancelQueries({ queryKey: ['settings', userId] });
      const previous = queryClient.getQueryData<UserSettings>(['settings', userId]);
      if (previous) {
        queryClient.setQueryData<UserSettings>(['settings', userId], {
          ...previous,
          ...newUpdates,
        });
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['settings', userId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', userId] });
    },
  });

  return {
    settings,
    isLoading: query.isLoading,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
