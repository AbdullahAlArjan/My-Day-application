import { PriorityLevel, TaskStatus } from './database';

export type TaskSortField = 
  | 'custom'
  | 'due_date'
  | 'priority'
  | 'created_at'
  | 'updated_at'
  | 'title';

export type TaskSortDirection = 'asc' | 'desc';

export interface TaskFilterOptions {
  categoryId?: string | null;
  priority?: PriorityLevel | 'all';
  status?: TaskStatus | 'all';
  dueRange?: 'all' | 'today' | 'upcoming' | 'overdue' | 'no_date';
  hasReminder?: boolean;
  hasSubtasks?: boolean;
  searchQuery?: string;
}

export interface TaskSortOptions {
  field: TaskSortField;
  direction: TaskSortDirection;
}

export type TaskGroupKey = 'overdue' | 'today' | 'upcoming' | 'completed' | 'no_date';

export interface TaskGroup {
  key: TaskGroupKey;
  label: string;
  tasks: import('./database').Task[];
}
