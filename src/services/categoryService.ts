import { supabase } from '@/integrations/supabase/client';
import type { Category } from '@/types/database';

export const categoryService = {
  async getCategories(userId: string): Promise<Category[]> {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    if (!categories || categories.length === 0) {
      return [];
    }

    // Get task counts for these categories
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, category_id, status')
      .eq('user_id', userId);

    if (tasksError) {
      console.error('Error fetching category task counts:', tasksError);
      return categories;
    }

    const countsMap = new Map<string, { total: number; completed: number }>();
    tasks?.forEach((t) => {
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
  },

  async createCategory(category: {
    user_id: string;
    name: string;
    color: string;
    icon?: string;
    sort_order?: number;
  }): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: category.user_id,
        name: category.name,
        color: category.color,
        icon: category.icon || 'Folder',
        sort_order: category.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }
    return data;
  },

  async updateCategory(
    id: string,
    updates: Partial<Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw error;
    }
    return data;
  },

  async deleteCategory(
    categoryId: string,
    reassignAction: 'unassign' | 'reassign',
    targetCategoryId?: string
  ): Promise<void> {
    if (reassignAction === 'reassign' && targetCategoryId) {
      // Reassign all tasks to target category
      const { error: moveError } = await supabase
        .from('tasks')
        .update({ category_id: targetCategoryId })
        .eq('category_id', categoryId);

      if (moveError) {
        console.error('Error reassigning tasks:', moveError);
        throw moveError;
      }
    } else {
      // Unassign tasks from this category
      const { error: unassignError } = await supabase
        .from('tasks')
        .update({ category_id: null })
        .eq('category_id', categoryId);

      if (unassignError) {
        console.error('Error unassigning tasks:', unassignError);
        throw unassignError;
      }
    }

    // Now delete category safely
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (deleteError) {
      console.error('Error deleting category:', deleteError);
      throw deleteError;
    }
  },

  async reorderCategories(categories: { id: string; sort_order: number }[]): Promise<void> {
    const promises = categories.map((c) =>
      supabase.from('categories').update({ sort_order: c.sort_order }).eq('id', c.id)
    );
    await Promise.all(promises);
  },
};
