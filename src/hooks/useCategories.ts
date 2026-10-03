import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { useAuth } from './useAuth';
import type { Category } from '@/types/database';

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-work-1',
    user_id: 'demo-user-id-001',
    name: 'Work',
    color: '#3B82F6',
    icon: 'Briefcase',
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    task_count: 0,
    completed_count: 0,
  },
  {
    id: 'cat-personal-2',
    user_id: 'demo-user-id-001',
    name: 'Personal',
    color: '#10B981',
    icon: 'User',
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    task_count: 0,
    completed_count: 0,
  },
  {
    id: 'cat-urgent-3',
    user_id: 'demo-user-id-001',
    name: 'Urgent',
    color: '#EF4444',
    icon: 'AlertCircle',
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    task_count: 0,
    completed_count: 0,
  },
];

export function useCategories() {
  const { user, isDemoUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ['categories', userId],
    queryFn: async (): Promise<Category[]> => {
      if (!userId || isDemoUser) {
        const saved = localStorage.getItem('my_day_local_categories');
        let categories = DEFAULT_CATEGORIES;
        if (saved) {
          try {
            categories = JSON.parse(saved);
          } catch {
            categories = DEFAULT_CATEGORIES;
          }
        } else {
          localStorage.setItem('my_day_local_categories', JSON.stringify(DEFAULT_CATEGORIES));
        }

        // Calculate live task counts for categories in demo mode
        const savedTasks = localStorage.getItem('my_day_local_tasks');
        let localTasks: any[] = [];
        if (savedTasks) {
          try {
            localTasks = JSON.parse(savedTasks);
          } catch {
            localTasks = [];
          }
        }

        const countsMap = new Map<string, { total: number; completed: number }>();
        localTasks.forEach((t) => {
          if (t.category_id) {
            const current = countsMap.get(t.category_id) || { total: 0, completed: 0 };
            current.total += 1;
            if (t.status === 'completed') {
              current.completed += 1;
            }
            countsMap.set(t.category_id, current);
          }
        });

        return categories.map((cat) => ({
          ...cat,
          task_count: countsMap.get(cat.id)?.total || 0,
          completed_count: countsMap.get(cat.id)?.completed || 0,
        }));
      }
      return categoryService.getCategories(userId);
    },
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async (newCat: { name: string; color: string; icon?: string }) => {
      if (!userId) throw new Error('User not authenticated');
      if (isDemoUser) {
        const current = query.data || [];
        const created: Category = {
          id: `cat-${Date.now()}`,
          user_id: userId,
          name: newCat.name,
          color: newCat.color,
          icon: newCat.icon || 'Folder',
          sort_order: current.length + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          task_count: 0,
          completed_count: 0,
        };
        const updated = [...current, created];
        localStorage.setItem('my_day_local_categories', JSON.stringify(updated));
        return created;
      }
      return categoryService.createCategory({
        user_id: userId,
        name: newCat.name,
        color: newCat.color,
        icon: newCat.icon,
        sort_order: (query.data?.length || 0) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
    }) => {
      if (isDemoUser) {
        const current = query.data || [];
        const updated = current.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
        localStorage.setItem('my_day_local_categories', JSON.stringify(updated));
        return updated.find((c) => c.id === id)!;
      }
      return categoryService.updateCategory(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({
      categoryId,
      reassignAction,
      targetCategoryId,
    }: {
      categoryId: string;
      reassignAction: 'unassign' | 'reassign';
      targetCategoryId?: string;
    }) => {
      if (isDemoUser) {
        const current = query.data || [];
        const filtered = current.filter((c) => c.id !== categoryId);
        localStorage.setItem('my_day_local_categories', JSON.stringify(filtered));

        // Update local tasks
        const savedTasks = localStorage.getItem('my_day_local_tasks');
        if (savedTasks) {
          try {
            const tasks: any[] = JSON.parse(savedTasks);
            const updatedTasks = tasks.map((t) => {
              if (t.category_id === categoryId) {
                return {
                  ...t,
                  category_id: reassignAction === 'reassign' && targetCategoryId ? targetCategoryId : null,
                };
              }
              return t;
            });
            localStorage.setItem('my_day_local_tasks', JSON.stringify(updatedTasks));
          } catch (e) {
            console.error(e);
          }
        }
        return;
      }
      return categoryService.deleteCategory(categoryId, reassignAction, targetCategoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
  };
}
