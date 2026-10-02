export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PriorityLevel = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';
export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'indigo' | 'violet' | 'blue' | 'emerald' | 'rose' | 'amber';
export type HomeViewMode = 'list' | 'compact' | 'board';
export type TimeFormat = '12h' | '24h';

export interface RecurrenceRule {
  type: 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';
  interval?: number;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  endDate?: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Computed / UI fields
  task_count?: number;
  completed_count?: number;
}

export interface Task {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  notes: string | null;
  priority: PriorityLevel;
  status: TaskStatus;
  due_date: string | null; // Format: YYYY-MM-DD
  due_time: string | null; // Format: HH:mm:ss or HH:mm
  reminder_at: string | null; // ISO timestamp
  recurrence_rule: RecurrenceRule | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // Joined fields
  category?: Category;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  theme: ThemeMode;
  accent_color: AccentColor;
  default_priority: PriorityLevel;
  first_day_of_week: 0 | 1; // 0 = Sunday, 1 = Monday
  time_format: TimeFormat;
  show_completed_tasks: boolean;
  default_home_view: HomeViewMode;
  animations_enabled: boolean;
  confirm_before_delete: boolean;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Partial<Category> & { user_id: string; name: string; color: string };
        Update: Partial<Category>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: Partial<Task> & { user_id: string; title: string };
        Update: Partial<Task>;
        Relationships: [];
      };
      subtasks: {
        Row: Subtask;
        Insert: Partial<Subtask> & { task_id: string; user_id: string; title: string };
        Update: Partial<Subtask>;
        Relationships: [];
      };
      user_settings: {
        Row: UserSettings;
        Insert: Partial<UserSettings> & { user_id: string };
        Update: Partial<UserSettings>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
