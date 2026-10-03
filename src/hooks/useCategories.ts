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

function getLocalCategoriesWithCounts(): Category[] {
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

export function useCategories() {
  const { user, isDemoUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const queryKey = ['categories', userId || 'local'];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<Category[]> => {
      if (!userId || isDemoUser) {
        return getLocalCategoriesWithCounts();
      }
      try {
        const remote = await categoryService.getCategories(userId);
        if (remote && remote.length > 0) {
          localStorage.setItem('my_day_local_categories', JSON.stringify(remote));
        }
        return remote;
      } catch (err) {
        console.warn('Backend getCategories failed, using local categories:', err);
        return getLocalCategoriesWithCounts();
      }
    },
    enabled: true,
  });

  const createMutation = useMutation({
    mutationFn: async (newCat: { name: string; color: string; icon?: string }) => {
      const activeUserId = userId || 'demo-user-id-001';
      const createLocal = () => {
        const current = query.data || getLocalCategoriesWithCounts();
        const created: Category = {
          id: `cat-${Date.now()}`,
          user_id: activeUserId,
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
      };

      if (!userId || isDemoUser) {
        return createLocal();
      }
      try {
        return await categoryService.createCategory({
          user_id: userId,
          name: newCat.name,
          color: newCat.color,
          icon: newCat.icon,
          sort_order: (query.data?.length || 0) + 1,
        });
      } catch (err) {
        console.warn('Backend createCategory failed, saving locally:', err);
        return createLocal();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
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
      const updateLocal = () => {
        const current = query.data || getLocalCategoriesWithCounts();
        const updated = current.map((c) =>
          c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
        );
        localStorage.setItem('my_day_local_categories', JSON.stringify(updated));
        return updated.find((c) => c.id === id)!;
      };

      if (!userId || isDemoUser) {
        return updateLocal();
      }
      try {
        return await categoryService.updateCategory(id, updates);
      } catch (err) {
        console.warn('Backend updateCategory failed, updating locally:', err);
        return updateLocal();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['tasks', userId || 'local'] });
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
      const deleteLocal = () => {
        const current = query.data || getLocalCategoriesWithCounts();
        const filtered = current.filter((c) => c.id !== categoryId);
        localStorage.setItem('my_day_local_categories', JSON.stringify(filtered));

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
      };

      if (!userId || isDemoUser) {
        deleteLocal();
        return;
      }
      try {
        await categoryService.deleteCategory(categoryId, reassignAction, targetCategoryId);
      } catch (err) {
        console.warn('Backend deleteCategory failed, deleting locally:', err);
        deleteLocal();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['tasks', userId || 'local'] });
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
