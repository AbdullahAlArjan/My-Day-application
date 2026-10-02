import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { useAuth } from './useAuth';
import type { Task, PriorityLevel, RecurrenceRule } from '@/types/database';
import type { TaskFilterOptions, TaskSortOptions } from '@/types/task';
import confetti from 'canvas-confetti';
import { getTodayDateString } from '@/lib/dateUtils';

export function useTasks(filters?: TaskFilterOptions, sorting?: TaskSortOptions) {
  const { user, isDemoUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const [lastDeletedTask, setLastDeletedTask] = useState<Task | null>(null);

  const queryKey = ['tasks', userId, filters, sorting];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<Task[]> => {
      if (!userId || isDemoUser) {
        const saved = localStorage.getItem('my_day_local_tasks');
        let localTasks: Task[] = [];
        if (saved) {
          try {
            localTasks = JSON.parse(saved);
          } catch {
            localTasks = [];
          }
        }

        // Apply filters locally in demo mode
        let result = [...localTasks];
        if (filters?.categoryId) {
          result = result.filter((t) => t.category_id === filters.categoryId);
        }
        if (filters?.priority && filters.priority !== 'all') {
          result = result.filter((t) => t.priority === filters.priority);
        }
        if (filters?.status && filters.status !== 'all') {
          result = result.filter((t) => t.status === filters.status);
        }
        const todayStr = getTodayDateString();
        if (filters?.dueRange) {
          if (filters.dueRange === 'today') {
            result = result.filter((t) => t.due_date === todayStr);
          } else if (filters.dueRange === 'overdue') {
            result = result.filter((t) => t.due_date && t.due_date < todayStr && t.status !== 'completed');
          } else if (filters.dueRange === 'upcoming') {
            result = result.filter((t) => t.due_date && t.due_date > todayStr);
          } else if (filters.dueRange === 'no_date') {
            result = result.filter((t) => !t.due_date);
          }
        }
        if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
          const q = filters.searchQuery.toLowerCase();
          result = result.filter((t) =>
            t.title.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.notes?.toLowerCase().includes(q)
          );
        }

        return result;
      }
      return taskService.getTasks(userId, filters, sorting);
    },
    enabled: !!userId,
  });

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6'],
        disableForReducedMotion: true,
      });
    } catch (e) {
      console.log('Confetti celebratory animation:', e);
    }
  }, []);

  const createMutation = useMutation({
    mutationFn: async (newTask: {
      title: string;
      description?: string | null;
      notes?: string | null;
      category_id?: string | null;
      priority?: PriorityLevel;
      due_date?: string | null;
      due_time?: string | null;
      reminder_at?: string | null;
      recurrence_rule?: RecurrenceRule | null;
      subtasks?: string[];
    }) => {
      if (!userId) throw new Error('User not authenticated');
      if (isDemoUser) {
        const saved = localStorage.getItem('my_day_local_tasks');
        const tasks: Task[] = saved ? JSON.parse(saved) : [];
        const created: Task = {
          id: `task-${Date.now()}`,
          user_id: userId,
          title: newTask.title,
          description: newTask.description || null,
          notes: newTask.notes || null,
          category_id: newTask.category_id || null,
          priority: newTask.priority || 'medium',
          status: 'pending',
          due_date: newTask.due_date || null,
          due_time: newTask.due_time || null,
          reminder_at: newTask.reminder_at || null,
          recurrence_rule: newTask.recurrence_rule || null,
          sort_order: tasks.length + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          completed_at: null,
          subtasks: newTask.subtasks?.map((title, i) => ({
            id: `subtask-${Date.now()}-${i}`,
            task_id: `task-${Date.now()}`,
            user_id: userId,
            title,
            is_completed: false,
            sort_order: i,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })) || [],
        };
        tasks.unshift(created);
        localStorage.setItem('my_day_local_tasks', JSON.stringify(tasks));
        return created;
      }
      return taskService.createTask({
        user_id: userId,
        ...newTask,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category' | 'subtasks'>>;
    }) => {
      if (isDemoUser) {
        const saved = localStorage.getItem('my_day_local_tasks');
        const tasks: Task[] = saved ? JSON.parse(saved) : [];
        const index = tasks.findIndex((t) => t.id === taskId);
        if (index !== -1) {
          const updated = {
            ...tasks[index],
            ...updates,
            updated_at: new Date().toISOString(),
            completed_at:
              updates.status === 'completed'
                ? new Date().toISOString()
                : updates.status === 'pending'
                ? null
                : tasks[index].completed_at,
          };
          tasks[index] = updated;
          localStorage.setItem('my_day_local_tasks', JSON.stringify(tasks));
          return updated;
        }
        throw new Error('Task not found');
      }
      return taskService.updateTask(taskId, updates);
    },
    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          queryKey,
          previousTasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  ...updates,
                  completed_at:
                    updates.status === 'completed'
                      ? new Date().toISOString()
                      : updates.status === 'pending'
                      ? null
                      : t.completed_at,
                }
              : t
          )
        );
      }
      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSuccess: (data) => {
      if (data.status === 'completed') {
        // Check if all today's tasks are completed
        const tasks = query.data || [];
        const todayStr = getTodayDateString();
        const todayTasks = tasks.filter((t) => t.due_date === todayStr);
        if (todayTasks.length > 0 && todayTasks.every((t) => t.id === data.id || t.status === 'completed')) {
          triggerCelebration();
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // Find task to preserve for Undo
      const taskToDelete = query.data?.find((t) => t.id === taskId);
      if (taskToDelete) {
        setLastDeletedTask(taskToDelete);
      }

      if (isDemoUser) {
        const saved = localStorage.getItem('my_day_local_tasks');
        const tasks: Task[] = saved ? JSON.parse(saved) : [];
        const filtered = tasks.filter((t) => t.id !== taskId);
        localStorage.setItem('my_day_local_tasks', JSON.stringify(filtered));
        return;
      }
      return taskService.deleteTask(taskId);
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          queryKey,
          previousTasks.filter((t) => t.id !== taskId)
        );
      }
      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const restoreLastDeletedTask = useCallback(async () => {
    if (!lastDeletedTask) return;
    const task = lastDeletedTask;
    setLastDeletedTask(null);

    await createMutation.mutateAsync({
      title: task.title,
      description: task.description,
      notes: task.notes,
      category_id: task.category_id,
      priority: task.priority,
      due_date: task.due_date,
      due_time: task.due_time,
      reminder_at: task.reminder_at,
      recurrence_rule: task.recurrence_rule,
      subtasks: task.subtasks?.map((s) => s.title),
    });
  }, [lastDeletedTask, createMutation]);

  const duplicateMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (isDemoUser) {
        const task = query.data?.find((t) => t.id === taskId);
        if (!task) throw new Error('Task not found');
        return createMutation.mutateAsync({
          title: `${task.title} (Copy)`,
          description: task.description,
          notes: task.notes,
          category_id: task.category_id,
          priority: task.priority,
          due_date: task.due_date,
          due_time: task.due_time,
          reminder_at: task.reminder_at,
          recurrence_rule: task.recurrence_rule,
          subtasks: task.subtasks?.map((s) => s.title),
        });
      }
      return taskService.duplicateTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    duplicateTask: duplicateMutation.mutateAsync,
    lastDeletedTask,
    restoreLastDeletedTask,
    triggerCelebration,
  };
}
