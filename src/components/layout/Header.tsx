import React from 'react';
import {
  Search,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { getDynamicGreeting, getFullCurrentDate } from '@/lib/dateUtils';
import { Dropdown } from '@/components/common/Dropdown';
import type { ThemeMode } from '@/types/database';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  todayProgress: {
    total: number;
    completed: number;
    remaining: number;
    percent: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSettings,
  todayProgress,
}) => {
  const { user, profile, signOut } = useAuth();
  const { settings, updateSettings } = useSettings();

  const greeting = getDynamicGreeting(profile?.timezone);
  const fullDate = getFullCurrentDate(profile?.timezone);
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'there';

  const cycleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const nextIndex = (modes.indexOf(settings.theme) + 1) % modes.length;
    updateSettings({ theme: modes[nextIndex] });
  };

  const themeIcon = {
    light: <Sun className="w-4 h-4 text-amber-500" />,
    dark: <Moon className="w-4 h-4 text-brand-400" />,
    system: <Laptop className="w-4 h-4 text-[var(--text-secondary)]" />,
  }[settings.theme] || <Sun className="w-4 h-4" />;

  const userMenuItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon className="w-4 h-4" />,
      onClick: onOpenSettings,
    },
    {
      id: 'logout',
      label: 'Sign out',
      icon: <LogOut className="w-4 h-4 text-red-500" />,
      danger: true,
      divider: true,
      onClick: signOut,
    },
  ];

  return (
    <header className="w-full bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] px-4 sm:px-8 pt-5 pb-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Date and dynamic greeting */}
        <div>
          <span className="text-xs font-medium text-[var(--text-muted)] tracking-wide uppercase">
            {fullDate}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight mt-0.5">
            {greeting}, {displayName}
          </h1>
        </div>

        {/* Top Actions: Search, Theme, Avatar menu */}
        <div className="flex items-center gap-2">
          {/* Quick Search trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] shadow-subtle transition-all"
            title="Search tasks (/)"
          >
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded text-[var(--text-muted)]">
              /
            </kbd>
          </button>

          {/* Theme switcher */}
          <button
            type="button"
            onClick={cycleTheme}
            className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] shadow-subtle text-[var(--text-secondary)] transition-all"
            title={`Theme: ${settings.theme}`}
          >
            {themeIcon}
          </button>

          {/* User Avatar dropdown */}
          <Dropdown
            trigger={
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 font-semibold text-xs flex items-center justify-center border border-[var(--border-subtle)] cursor-pointer hover:ring-2 hover:ring-brand-500/20 transition-all">
                {displayName.charAt(0).toUpperCase()}
              </div>
            }
            items={userMenuItems}
          />
        </div>
      </div>

      {/* Progress Summary Section (Requirement 6) */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3 sm:p-4 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">
              {todayProgress.total === 0
                ? "You're all clear for today."
                : todayProgress.remaining === 0
                ? 'All tasks completed for today! 🎉'
                : `You have ${todayProgress.remaining} task${
                    todayProgress.remaining === 1 ? '' : 's'
                  } remaining today`}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-medium">
            <span>
              {todayProgress.completed} of {todayProgress.total} completed
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold">
              {todayProgress.percent}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              todayProgress.percent === 100
                ? 'bg-emerald-500'
                : 'bg-brand-500'
            }`}
            style={{ width: `${todayProgress.percent}%` }}
          />
        </div>
      </div>
    </header>
  );
};
