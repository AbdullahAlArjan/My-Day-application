import React, { useState } from 'react';
import {
  SunMedium,
  CheckCircle2,
  Calendar,
  FolderKanban,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Laptop,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import type { ThemeMode } from '@/types/database';

export type NavigationPage = 'today' | 'calendar' | 'categories' | 'completed' | 'settings';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  todayProgress: {
    total: number;
    completed: number;
    percent: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  todayProgress,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut, user, profile } = useAuth();
  const { settings, updateSettings } = useSettings();

  const navItems = [
    {
      id: 'today' as NavigationPage,
      label: 'Today',
      icon: SunMedium,
      countBadge: todayProgress.total - todayProgress.completed > 0 ? todayProgress.total - todayProgress.completed : undefined,
    },
    {
      id: 'calendar' as NavigationPage,
      label: 'Calendar',
      icon: Calendar,
    },
    {
      id: 'categories' as NavigationPage,
      label: 'Categories',
      icon: FolderKanban,
    },
    {
      id: 'completed' as NavigationPage,
      label: 'Completed',
      icon: CheckCircle2,
    },
    {
      id: 'settings' as NavigationPage,
      label: 'Settings',
      icon: Settings,
    },
  ];

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

  return (
    <aside
      className={`hidden md:flex flex-col justify-between shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] transition-all duration-200 select-none z-20 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Brand Section */}
      <div className="p-3.5">
        <div className="flex items-center justify-between gap-2.5 px-2 py-1.5 mb-4">
          <div className="flex items-center gap-2.5 overflow-hidden cursor-pointer" onClick={() => onNavigate('today')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">
                  My Day
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                  Personal Planner
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 w-full px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-brand-600 dark:text-brand-400' : 'text-[var(--text-muted)]'
                  }`}
                />
                {!isCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                {!isCollapsed && item.countBadge !== undefined && (
                  <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                    {item.countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-[var(--border-subtle)] flex flex-col gap-2">
        {/* Today's Mini Progress */}
        {!isCollapsed && (
          <div className="p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] mb-1">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1.5 font-medium">
              <span>Today's Progress</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {todayProgress.percent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${todayProgress.percent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] mt-1.5">
              <span>{todayProgress.completed} of {todayProgress.total} completed</span>
            </div>
          </div>
        )}

        {/* Theme Switcher Button */}
        <button
          type="button"
          onClick={cycleTheme}
          title={`Theme: ${settings.theme}`}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
        >
          {themeIcon}
          {!isCollapsed && (
            <span className="capitalize">{settings.theme} Theme</span>
          )}
        </button>

        {/* User Info & Logout */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 font-semibold text-xs flex items-center justify-center shrink-0">
              {(profile?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-tight truncate">
                <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                  {profile?.display_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] truncate">
                  {user?.email || 'Personal Account'}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
