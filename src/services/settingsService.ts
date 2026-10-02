import { supabase } from '@/integrations/supabase/client';
import type { UserSettings } from '@/types/database';

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id' | 'updated_at'> = {
  theme: 'system',
  accent_color: 'indigo',
  default_priority: 'medium',
  first_day_of_week: 1, // Monday
  time_format: '12h',
  show_completed_tasks: true,
  default_home_view: 'list',
  animations_enabled: true,
  confirm_before_delete: true,
};

export const settingsService = {
  async getSettings(userId: string): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }

    if (!data) {
      // Upsert default settings
      const newSettings: UserSettings = {
        user_id: userId,
        ...DEFAULT_SETTINGS,
        updated_at: new Date().toISOString(),
      };

      const { data: created, error: insertError } = await supabase
        .from('user_settings')
        .upsert(newSettings)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default settings:', insertError);
        return newSettings;
      }
      return created;
    }

    return data;
  },

  async updateSettings(
    userId: string,
    updates: Partial<Omit<UserSettings, 'user_id' | 'updated_at'>>
  ): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
    return data;
  },
};
