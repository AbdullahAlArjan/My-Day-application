import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useRealtime() {
  const { user, isDemoUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  useEffect(() => {
    if (!isSupabaseConfigured() || !userId || isDemoUser) {
      return;
    }

    const channelName = `realtime-user-${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subtasks',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected to realtime
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isDemoUser, queryClient]);
}
