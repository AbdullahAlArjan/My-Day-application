import { supabase } from '@/integrations/supabase/client';
import type { Subtask } from '@/types/database';

export const subtaskService = {
  async getSubtasks(taskId: string): Promise<Subtask[]> {
    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching subtasks:', error);
      throw error;
    }
    return data || [];
  },

  async createSubtask(subtask: {
    task_id: string;
    user_id: string;
    title: string;
    is_completed?: boolean;
    sort_order?: number;
  }): Promise<Subtask> {
    const { data, error } = await supabase
      .from('subtasks')
      .insert({
        task_id: subtask.task_id,
        user_id: subtask.user_id,
        title: subtask.title.trim(),
        is_completed: subtask.is_completed ?? false,
        sort_order: subtask.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subtask:', error);
      throw error;
    }
    return data;
  },

  async updateSubtask(
    id: string,
    updates: Partial<Omit<Subtask, 'id' | 'task_id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<Subtask> {
    const { data, error } = await supabase
      .from('subtasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subtask:', error);
      throw error;
    }
    return data;
  },

  async deleteSubtask(id: string): Promise<void> {
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subtask:', error);
      throw error;
    }
  },

  async reorderSubtasks(subtasks: { id: string; sort_order: number }[]): Promise<void> {
    const promises = subtasks.map((s) =>
      supabase.from('subtasks').update({ sort_order: s.sort_order }).eq('id', s.id)
    );
    await Promise.all(promises);
  },
};
