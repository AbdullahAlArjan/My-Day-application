import React from 'react';
import { SunMedium, Calendar, Plus, FolderKanban, Settings } from 'lucide-react';
import type { NavigationPage } from './Sidebar';

interface BottomNavProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onOpenCreateTask: () => void;
  todayRemainingCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  onNavigate,
  onOpenCreateTask,
  todayRemainingCount,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border-subtle)] pb-[env(safe-area-inset-bottom,0px)] shadow-lg select-none">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {/* Today */}
        <button
          type="button"
          onClick={() => onNavigate('today')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative ${
            currentPage === 'today'
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <SunMedium className="w-5 h-5" />
          <span className="text-[10px]">Today</span>
          {todayRemainingCount > 0 && (
            <span className="absolute top-2 right-1/4 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-[var(--bg-surface)]" />
          )}
        </button>

        {/* Calendar */}
        <button
          type="button"
          onClick={() => onNavigate('calendar')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            currentPage === 'calendar'
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Calendar</span>
        </button>

        {/* Central Prominent Add Task Button */}
        <div className="flex-1 flex justify-center -translate-y-3">
          <button
            type="button"
            onClick={onOpenCreateTask}
            className="w-12 h-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-elevated flex items-center justify-center active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-brand-500/20"
            aria-label="Add task"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Categories */}
        <button
          type="button"
          onClick={() => onNavigate('categories')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            currentPage === 'categories'
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FolderKanban className="w-5 h-5" />
          <span className="text-[10px]">Categories</span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            currentPage === 'settings'
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </div>
    </div>
  );
};
