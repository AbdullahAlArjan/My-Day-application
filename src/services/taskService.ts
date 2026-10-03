import { supabase } from '@/integrations/supabase/client';
import type { Task, Subtask, RecurrenceRule, PriorityLevel, TaskStatus } from '@/types/database';
import type { TaskFilterOptions, TaskSortOptions } from '@/types/task';
import { getTodayDateString, addDays } from '@/lib/dateUtils';

export const taskService = {
  async getTasks(
    userId: string,
    filters?: TaskFilterOptions,
    sorting?: TaskSortOptions
  ): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select('*, category:categories(*), subtasks(*)')
      .eq('user_id', userId);

    // Apply category filter
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    // Apply priority filter
    if (filters?.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }

    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // Apply due range filter
    const todayStr = getTodayDateString();
    if (filters?.dueRange) {
      if (filters.dueRange === 'today') {
        query = query.eq('due_date', todayStr);
      } else if (filters.dueRange === 'overdue') {
        query = query.lt('due_date', todayStr).neq('status', 'completed');
      } else if (filters.dueRange === 'upcoming') {
        query = query.gt('due_date', todayStr);
      } else if (filters.dueRange === 'no_date') {
        query = query.is('due_date', null);
      }
    }

    // Apply text search
    if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = `%${filters.searchQuery.trim()}%`;
      query = query.or(`title.ilike.${q},description.ilike.${q},notes.ilike.${q}`);
    }

    // Sorting
    const sortField = sorting?.field || 'custom';
    const ascending = sorting?.direction === 'asc';

    if (sortField === 'custom') {
      query = query.order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    } else if (sortField === 'due_date') {
      query = query.order('due_date', { ascending, nullsFirst: false });
    } else if (sortField === 'priority') {
      // Postgres enum/text sort
      query = query.order('priority', { ascending });
    } else if (sortField === 'created_at') {
      query = query.order('created_at', { ascending });
    } else if (sortField === 'title') {
      query = query.order('title', { ascending });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    let tasks = (data || []) as Task[];

    // In-memory filters for nested/compound fields if any
    if (filters?.hasReminder) {
      tasks = tasks.filter((t) => !!t.reminder_at);
    }
    if (filters?.hasSubtasks) {
      tasks = tasks.filter((t) => t.subtasks && t.subtasks.length > 0);
    }

    return tasks;
  },

  async getTaskById(taskId: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, category:categories(*), subtasks(*)')
      .eq('id', taskId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching task by id:', error);
      throw error;
    }
    return data as Task | null;
  },

  async createTask(task: {
    user_id: string;
    title: string;
    description?: string | null;
    notes?: string | null;
    category_id?: string | null;
    priority?: PriorityLevel;
    due_date?: string | null;
    due_time?: string | null;
    reminder_at?: string | null;
    recurrence_rule?: RecurrenceRule | null;
    sort_order?: number;
    subtasks?: string[]; // Titles of initial subtasks
  }): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: task.user_id,
        title: task.title.trim(),
        description: task.description || null,
        notes: task.notes || null,
        category_id: task.category_id || null,
        priority: task.priority || 'medium',
        status: 'pending',
        due_date: task.due_date || null,
        due_time: task.due_time || null,
        reminder_at: task.reminder_at || null,
        recurrence_rule: task.recurrence_rule || null,
        sort_order: task.sort_order ?? 0,
      })
      .select('*, category:categories(*)')
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    const createdTask = data as Task;

    // Create subtasks if provided
    if (task.subtasks && task.subtasks.length > 0) {
      const subtaskInserts = task.subtasks
        .filter((title) => title.trim().length > 0)
        .map((title, index) => ({
          task_id: createdTask.id,
          user_id: task.user_id,
          title: title.trim(),
          is_completed: false,
          sort_order: index,
        }));

      if (subtaskInserts.length > 0) {
        const { data: createdSubtasks } = await supabase
          .from('subtasks')
          .insert(subtaskInserts)
          .select();
        createdTask.subtasks = (createdSubtasks || []) as Subtask[];
      }
    } else {
      createdTask.subtasks = [];
    }

    return createdTask;
  },

  async updateTask(
    taskId: string,
    updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category' | 'subtasks'>> & {
      subtasks?: Subtask[];
      category?: unknown;
    }
  ): Promise<Task> {
    const updatePayload: Record<string, unknown> = { ...updates };

    // Remove relations that don't exist as columns in the `tasks` table
    delete updatePayload.subtasks;
    delete updatePayload.category;

    // Convert empty string values to null for Postgres type safety
    if (updatePayload.due_time === '') updatePayload.due_time = null;
    if (updatePayload.due_date === '') updatePayload.due_date = null;
    if (updatePayload.category_id === '') updatePayload.category_id = null;
    if (updatePayload.reminder_at === '') updatePayload.reminder_at = null;
    if (updatePayload.description === '') updatePayload.description = null;
    if (updatePayload.notes === '') updatePayload.notes = null;

    if ('status' in updates) {
      if (updates.status === 'completed') {
        updatePayload.completed_at = new Date().toISOString();
      } else if (updates.status === 'pending') {
        updatePayload.completed_at = null;
      }
    }

    // Only update tasks table if there are fields to update
    let updatedTask: Task;
    if (Object.keys(updatePayload).length > 0) {
      const { data, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .select('*, category:categories(*), subtasks(*)')
        .single();

      if (error) {
        console.error('Error updating task:', error);
        throw error;
      }
      updatedTask = data as Task;
    } else {
      const existing = await this.getTaskById(taskId);
      if (!existing) throw new Error('Task not found');
      updatedTask = existing;
    }

    // Check for recurrence generation on complete
    if (updates.status === 'completed' && updatedTask.recurrence_rule && updatedTask.recurrence_rule.type !== 'none') {
      await this.handleRecurringTaskCreation(updatedTask);
    }

    return updatedTask;
  },

  async handleRecurringTaskCreation(completedTask: Task): Promise<void> {
    const rule = completedTask.recurrence_rule;
    if (!rule || rule.type === 'none') return;

    let nextDueDate: string | null = null;
    const baseDate = completedTask.due_date ? new Date(completedTask.due_date) : new Date();

    if (rule.type === 'daily') {
      nextDueDate = addDays(baseDate, 1).toISOString().split('T')[0];
    } else if (rule.type === 'weekdays') {
      let candidate = addDays(baseDate, 1);
      // Skip Saturday (6) and Sunday (0)
      while (candidate.getDay() === 0 || candidate.getDay() === 6) {
        candidate = addDays(candidate, 1);
      }
      nextDueDate = candidate.toISOString().split('T')[0];
    } else if (rule.type === 'weekly') {
      nextDueDate = addDays(baseDate, 7).toISOString().split('T')[0];
    } else if (rule.type === 'monthly') {
      const nextMonth = new Date(baseDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextDueDate = nextMonth.toISOString().split('T')[0];
    } else if (rule.type === 'custom' && rule.interval) {
      nextDueDate = addDays(baseDate, rule.interval).toISOString().split('T')[0];
    }

    if (nextDueDate) {
      await this.createTask({
        user_id: completedTask.user_id,
        title: completedTask.title,
        description: completedTask.description,
        notes: completedTask.notes,
        category_id: completedTask.category_id,
        priority: completedTask.priority,
        due_date: nextDueDate,
        due_time: completedTask.due_time,
        reminder_at: null,
        recurrence_rule: completedTask.recurrence_rule,
        subtasks: completedTask.subtasks?.map((s) => s.title),
      });
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  async duplicateTask(taskId: string): Promise<Task> {
    const original = await this.getTaskById(taskId);
    if (!original) throw new Error('Task not found');

    return this.createTask({
      user_id: original.user_id,
      title: `${original.title} (Copy)`,
      description: original.description,
      notes: original.notes,
      category_id: original.category_id,
      priority: original.priority,
      due_date: original.due_date,
      due_time: original.due_time,
      reminder_at: original.reminder_at,
      recurrence_rule: original.recurrence_rule,
      subtasks: original.subtasks?.map((s) => s.title),
    });
  },

  async reorderTasks(taskOrders: { id: string; sort_order: number }[]): Promise<void> {
    const promises = taskOrders.map((t) =>
      supabase.from('tasks').update({ sort_order: t.sort_order }).eq('id', t.id)
    );
    await Promise.all(promises);
  },

  async clearAllTasks(userId: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('user_id', userId);
    if (error) {
      console.error('Error clearing tasks:', error);
      throw error;
    }
  },

  async exportData(userId: string): Promise<{
    version: string;
    exported_at: string;
    categories: unknown[];
    tasks: unknown[];
    settings: unknown;
  }> {
    const [categoriesRes, tasksRes, settingsRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', userId),
      supabase.from('tasks').select('*, subtasks(*)').eq('user_id', userId),
      supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      categories: categoriesRes.data || [],
      tasks: tasksRes.data || [],
      settings: settingsRes.data || null,
    };
  },

  async importData(userId: string, data: any): Promise<void> {
    if (!data || !Array.isArray(data.tasks)) {
      throw new Error('Invalid backup file format');
    }

    // Map old category ids to new category ids
    const categoryIdMap = new Map<string, string>();

    if (Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        const { data: insertedCat } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: cat.name,
            color: cat.color || '#3b82f6',
            icon: cat.icon || 'Folder',
            sort_order: cat.sort_order || 0,
          })
          .select()
          .single();

        if (insertedCat && cat.id) {
          categoryIdMap.set(cat.id, insertedCat.id);
        }
      }
    }

    // Insert tasks and subtasks
    for (const t of data.tasks) {
      const newCatId = t.category_id ? categoryIdMap.get(t.category_id) || null : null;
      const { data: insertedTask } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          category_id: newCatId,
          title: t.title,
          description: t.description,
          notes: t.notes,
          priority: t.priority || 'medium',
          status: t.status || 'pending',
          due_date: t.due_date,
          due_time: t.due_time,
          reminder_at: t.reminder_at,
          recurrence_rule: t.recurrence_rule,
          sort_order: t.sort_order || 0,
        })
        .select()
        .single();

      if (insertedTask && Array.isArray(t.subtasks) && t.subtasks.length > 0) {
        const subtaskInserts = t.subtasks.map((s: any, idx: number) => ({
          task_id: insertedTask.id,
          user_id: userId,
          title: s.title,
          is_completed: s.is_completed || false,
          sort_order: s.sort_order ?? idx,
        }));
        await supabase.from('subtasks').insert(subtaskInserts);
      }
    }
  },
};
