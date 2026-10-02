import React, { useState, useMemo, useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ToastProvider, useToast } from '@/components/common/Toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavigationPage } from '@/components/layout/Sidebar';
import { TodayPage } from '@/pages/TodayPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { CompletedPage } from '@/pages/CompletedPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AuthPage } from '@/components/auth/AuthPage';
import { TaskModal } from '@/components/task/TaskModal';
import { TaskDetails } from '@/components/task/TaskDetails';
import { CategoryManagerModal } from '@/components/category/CategoryManagerModal';
import { SearchModal } from '@/components/common/SearchModal';
import { FocusModeModal } from '@/components/task/FocusModeModal';
import { useTasks } from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import { useRealtime } from '@/hooks/useRealtime';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { getTodayDateString } from '@/lib/dateUtils';
import type { Task } from '@/types/database';
import type { TaskFilterOptions, TaskSortOptions } from '@/types/task';
import { Loader2, Sparkles } from 'lucide-react';

const MainApplication: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const toast = useToast();

  // Navigation State
  const [currentPage, setCurrentPage] = useState<NavigationPage>('today');

  // Modals & Panels State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDefaultDate, setCreateDefaultDate] = useState<string | undefined>(undefined);
  const [createDefaultCategoryId, setCreateDefaultCategoryId] = useState<string | undefined>(undefined);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Filter & Sort State
  const [filters, setFilters] = useState<TaskFilterOptions>({
    categoryId: null,
    priority: 'all',
    status: 'all',
    dueRange: 'all',
    searchQuery: '',
  });

  const [sorting, setSorting] = useState<TaskSortOptions>({
    field: 'custom',
    direction: 'asc',
  });

  // Enable Realtime Synchronization
  useRealtime();

  // Task & Category Hooks
  const {
    tasks: allUserTasks,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
  } = useTasks();

  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  // Keyboard Shortcuts Hook (Requirement 19)
  useKeyboardShortcuts({
    onNewTask: () => {
      setCreateDefaultDate(getTodayDateString());
      setIsCreateModalOpen(true);
    },
    onFocusSearch: () => setIsSearchModalOpen(true),
    onGoToToday: () => setCurrentPage('today'),
    onOpenCalendar: () => setCurrentPage('calendar'),
    onEscape: () => {
      setIsCreateModalOpen(false);
      setIsDetailsOpen(false);
      setIsSearchModalOpen(false);
      setIsCategoryModalOpen(false);
      setIsFocusModalOpen(false);
    },
  });

  // Native Android hardware back-button listener
  useEffect(() => {
    let backButtonSub: any = null;
    try {
      backButtonSub = CapApp.addListener('backButton', () => {
        if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
          return;
        }
        if (isDetailsOpen) {
          setIsDetailsOpen(false);
          return;
        }
        if (isSearchModalOpen) {
          setIsSearchModalOpen(false);
          return;
        }
        if (isCategoryModalOpen) {
          setIsCategoryModalOpen(false);
          return;
        }
        if (isFocusModalOpen) {
          setIsFocusModalOpen(false);
          return;
        }
        if (currentPage !== 'today') {
          setCurrentPage('today');
          return;
        }
        CapApp.exitApp();
      });
    } catch {
      // Running in standard web browser
    }

    return () => {
      if (backButtonSub && typeof backButtonSub.then === 'function') {
        backButtonSub.then((s: any) => s.remove());
      }
    };
  }, [
    isCreateModalOpen,
    isDetailsOpen,
    isSearchModalOpen,
    isCategoryModalOpen,
    isFocusModalOpen,
    currentPage,
  ]);

  // Calculate live Today Progress (Section 6)
  const todayProgress = useMemo(() => {
    const todayStr = getTodayDateString();
    const todayTasks = allUserTasks.filter((t) => t.due_date === todayStr);
    const total = todayTasks.length;
    const completed = todayTasks.filter((t) => t.status === 'completed').length;
    const remaining = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, remaining, percent };
  }, [allUserTasks]);

  // Auth loading screen
  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-canvas)]">
        <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white mb-3 shadow-md">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <p className="text-xs text-[var(--text-muted)] font-medium">Loading My Day...</p>
      </div>
    );
  }

  // Not authenticated screen
  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <AppLayout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenCreateTask={() => {
          setCreateDefaultDate(getTodayDateString());
          setIsCreateModalOpen(true);
        }}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        todayProgress={todayProgress}
      >
        {currentPage === 'today' && (
          <TodayPage
            onOpenCreateTask={() => {
              setCreateDefaultDate(getTodayDateString());
              setIsCreateModalOpen(true);
            }}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onSelectTask={(task) => {
              setSelectedTask(task);
              setIsDetailsOpen(true);
            }}
            onFocusTask={(task) => {
              setFocusTask(task);
              setIsFocusModalOpen(true);
            }}
            filters={filters}
            onUpdateFilters={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
            sorting={sorting}
          />
        )}

        {currentPage === 'calendar' && (
          <CalendarPage
            onSelectTask={(task) => {
              setSelectedTask(task);
              setIsDetailsOpen(true);
            }}
            onOpenCreateTaskWithDate={(dateStr) => {
              setCreateDefaultDate(dateStr);
              setIsCreateModalOpen(true);
            }}
          />
        )}

        {currentPage === 'categories' && (
          <CategoriesPage
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            onFilterByCategory={(catId) => {
              setFilters((prev) => ({ ...prev, categoryId: catId }));
              setCurrentPage('today');
            }}
          />
        )}

        {currentPage === 'completed' && (
          <CompletedPage
            onSelectTask={(task) => {
              setSelectedTask(task);
              setIsDetailsOpen(true);
            }}
          />
        )}

        {currentPage === 'settings' && <SettingsPage />}
      </AppLayout>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          await createTask(data);
          toast.success('Task created successfully');
        }}
        defaultDate={createDefaultDate}
        defaultCategoryId={createDefaultCategoryId}
      />

      {/* Task Details Modal / Panel */}
      <TaskDetails
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onUpdate={async (taskId, updates) => {
          const updated = await updateTask({ taskId, updates });
          setSelectedTask(updated);
          return updated;
        }}
        onDelete={async (task) => {
          await deleteTask(task.id);
          setIsDetailsOpen(false);
          setSelectedTask(null);
          toast.info(`Deleted "${task.title}"`);
        }}
        onDuplicate={async (task) => {
          await duplicateTask(task.id);
          setIsDetailsOpen(false);
          setSelectedTask(null);
          toast.success(`Duplicated "${task.title}"`);
        }}
        onToggleComplete={async (task) => {
          const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
          const updated = await updateTask({
            taskId: task.id,
            updates: { status: nextStatus },
          });
          setSelectedTask(updated);
        }}
      />

      {/* Categories Management Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCreateCategory={async (cat) => {
          const created = await createCategory(cat);
          toast.success('Category created');
          return created;
        }}
        onUpdateCategory={async (id, updates) => {
          const updated = await updateCategory({ id, updates });
          toast.success('Category updated');
          return updated;
        }}
        onDeleteCategory={async (id, action, targetCatId) => {
          await deleteCategory({ categoryId: id, reassignAction: action, targetCategoryId: targetCatId });
          toast.success('Category deleted');
        }}
      />

      {/* Search & Filter Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        filters={filters}
        onUpdateFilters={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
        sorting={sorting}
        onUpdateSorting={setSorting}
        onResetFilters={() => {
          setFilters({
            categoryId: null,
            priority: 'all',
            status: 'all',
            dueRange: 'all',
            searchQuery: '',
          });
          toast.info('Filters cleared');
        }}
      />

      {/* Single Task Focus Mode Modal */}
      <FocusModeModal
        task={focusTask}
        isOpen={isFocusModalOpen}
        onClose={() => {
          setIsFocusModalOpen(false);
          setFocusTask(null);
        }}
        onComplete={async (task) => {
          await updateTask({
            taskId: task.id,
            updates: { status: 'completed' },
          });
          toast.success(`Completed "${task.title}"! 🎉`);
        }}
      />
    </>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MainApplication />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
