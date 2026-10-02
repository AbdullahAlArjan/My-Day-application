-- ==============================================================================
-- Schema Migration: 20261003000000_init_my_day_schema.sql
-- Application: "My Day" - Personal Daily Task Planner
-- Database: Supabase PostgreSQL
-- ==============================================================================

-- 1. EXTENSIONS & HELPER FUNCTIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Amman',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Folder',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT category_name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- 4. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    due_date DATE,
    due_time TIME,
    reminder_at TIMESTAMPTZ,
    recurrence_rule JSONB,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT task_title_not_empty CHECK (char_length(trim(title)) > 0)
);

-- 5. SUBTASKS TABLE
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT subtask_title_not_empty CHECK (char_length(trim(title)) > 0)
);

-- 6. USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    accent_color TEXT NOT NULL DEFAULT 'indigo' CHECK (accent_color IN ('indigo', 'violet', 'blue', 'emerald', 'rose', 'amber')),
    default_priority TEXT NOT NULL DEFAULT 'medium' CHECK (default_priority IN ('low', 'medium', 'high')),
    first_day_of_week INTEGER NOT NULL DEFAULT 1 CHECK (first_day_of_week IN (0, 1)), -- 0: Sunday, 1: Monday
    time_format TEXT NOT NULL DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
    show_completed_tasks BOOLEAN NOT NULL DEFAULT true,
    default_home_view TEXT NOT NULL DEFAULT 'list' CHECK (default_home_view IN ('list', 'compact', 'board')),
    animations_enabled BOOLEAN NOT NULL DEFAULT true,
    confirm_before_delete BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON public.tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON public.tasks(sort_order);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_user_id ON public.subtasks(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_sort_order ON public.subtasks(sort_order);

-- 8. UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_subtasks_updated_at ON public.subtasks;
CREATE TRIGGER trg_subtasks_updated_at
    BEFORE UPDATE ON public.subtasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER trg_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. NEW USER REGISTRATION INITIALIZATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user_init()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
BEGIN
    -- Determine display name safely from auth metadata
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'User'
    );

    -- 1. Create Profile
    INSERT INTO public.profiles (id, display_name, timezone)
    VALUES (NEW.id, user_name, 'Asia/Amman')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create User Settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Create Default Categories (Idempotent)
    INSERT INTO public.categories (user_id, name, color, icon, sort_order)
    VALUES 
        (NEW.id, 'Work', '#3B82F6', 'Briefcase', 1),
        (NEW.id, 'Personal', '#10B981', 'User', 2),
        (NEW.id, 'Urgent', '#EF4444', 'AlertCircle', 3)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_init();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- Categories Policies
CREATE POLICY "Users can view their own categories"
    ON public.categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- Tasks Policies
CREATE POLICY "Users can view their own tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND (
            category_id IS NULL 
            OR EXISTS (
                SELECT 1 FROM public.categories 
                WHERE id = category_id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own tasks"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id 
        AND (
            category_id IS NULL 
            OR EXISTS (
                SELECT 1 FROM public.categories 
                WHERE id = category_id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete their own tasks"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);

-- Subtasks Policies
CREATE POLICY "Users can view their own subtasks"
    ON public.subtasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subtasks"
    ON public.subtasks FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM public.tasks 
            WHERE id = task_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own subtasks"
    ON public.subtasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subtasks"
    ON public.subtasks FOR DELETE
    USING (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
    ON public.user_settings FOR DELETE
    USING (auth.uid() = user_id);

-- 11. SUPABASE REALTIME CONFIGURATION
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.subtasks;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
