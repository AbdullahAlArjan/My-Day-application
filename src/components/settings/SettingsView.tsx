import React, { useState, useRef } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { taskService } from '@/services/taskService';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/Toast';
import { ACCENT_COLORS } from '@/lib/theme';
import type { ThemeMode, AccentColor, PriorityLevel, HomeViewMode, TimeFormat } from '@/types/database';
import {
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  Trash2,
  Keyboard,
  Globe,
  Clock,
  Palette,
  Check,
} from 'lucide-react';

const COMMON_TIMEZONES = [
  'Asia/Amman',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { user, profile, isDemoUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(profile?.timezone || 'Asia/Amman');

  const handleExportData = async () => {
    try {
      let data: any;
      if (isDemoUser || !user) {
        const tasks = JSON.parse(localStorage.getItem('my_day_local_tasks') || '[]');
        const categories = JSON.parse(localStorage.getItem('my_day_local_categories') || '[]');
        const settings = JSON.parse(localStorage.getItem('my_day_local_settings') || '{}');
        data = {
          version: '1.0',
          exported_at: new Date().toISOString(),
          categories,
          tasks,
          settings,
        };
      } else {
        data = await taskService.exportData(user.id);
      }

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-day-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Also copy to clipboard as convenient fallback on mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(jsonStr);
          toast.success('Backup exported & copied to clipboard!');
          return;
        } catch {
          // fallback
        }
      }
      toast.success('Task backup exported successfully!');
    } catch {
      toast.error('Failed to export data');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (isDemoUser || !user) {
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          localStorage.setItem('my_day_local_tasks', JSON.stringify(parsed.tasks));
        }
        if (parsed.categories && Array.isArray(parsed.categories)) {
          localStorage.setItem('my_day_local_categories', JSON.stringify(parsed.categories));
        }
        toast.success('Data imported successfully!');
        window.location.reload();
        return;
      }

      await taskService.importData(user.id, parsed);
      toast.success('Data imported successfully!');
      window.location.reload();
    } catch {
      toast.error('Failed to import backup file. Ensure valid JSON format.');
    }
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      if (isDemoUser || !user) {
        localStorage.removeItem('my_day_local_tasks');
        setShowClearConfirm(false);
        toast.success('All tasks cleared successfully');
        window.location.reload();
        return;
      }

      await taskService.clearAllTasks(user.id);
      setShowClearConfirm(false);
      toast.success('All tasks cleared successfully');
      window.location.reload();
    } catch {
      toast.error('Failed to clear task data');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl pb-12">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Preferences & Settings</h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Customize themes, regional standards, and your personal workflow.
        </p>
      </div>

      {/* 1. APPEARANCE & THEME */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-subtle flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
          <Palette className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Appearance</h3>
        </div>

        {/* Theme mode: Light, Dark, System */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)]">Theme</label>
            <p className="text-xs text-[var(--text-muted)]">Select your preferred color scheme</p>
          </div>
          <div className="flex items-center bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)]">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Laptop },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = settings.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateSettings({ theme: t.id as ThemeMode })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)]">Accent Color</label>
            <p className="text-xs text-[var(--text-muted)]">Custom primary highlights</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((acc) => {
              const info = ACCENT_COLORS[acc];
              const isSelected = settings.accent_color === acc;
              return (
                <button
                  key={acc}
                  type="button"
                  onClick={() => updateSettings({ accent_color: acc })}
                  title={info.label}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xs"
                  style={{ backgroundColor: info.primary }}
                >
                  {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Animations toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)]">Micro-Animations</label>
            <p className="text-xs text-[var(--text-muted)]">Enable subtle spring transitions</p>
          </div>
          <input
            type="checkbox"
            checked={settings.animations_enabled}
            onChange={(e) => updateSettings({ animations_enabled: e.target.checked })}
            className="w-4 h-4 text-brand-600 rounded border-[var(--border-strong)] focus:ring-brand-500"
          />
        </div>
      </section>

      {/* 2. REGIONAL & TIMEZONE */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-subtle flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
          <Globe className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Time & Region</h3>
        </div>

        {/* Timezone */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)]">User Timezone</label>
            <p className="text-xs text-[var(--text-muted)]">Default timezone: Asia/Amman</p>
          </div>
          <select
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
            className="bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl text-xs py-1.5 px-3 focus:outline-none"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Time Format: 12h vs 24h */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)]">Time Format</label>
            <p className="text-xs text-[var(--text-muted)]">Display 12-hour (AM/PM) or 24-hour clock</p>
          </div>
          <div className="flex items-center bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)]">
            {(['12h', '24h'] as TimeFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => updateSettings({ time_format: fmt })}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  settings.time_format === fmt
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-xs'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* First day of week */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)]">First Day of the Week</label>
            <p className="text-xs text-[var(--text-muted)]">Determines calendar layout starting column</p>
          </div>
          <select
            value={settings.first_day_of_week}
            onChange={(e) =>
              updateSettings({
                first_day_of_week: parseInt(e.target.value, 10) as 0 | 1,
              })
            }
            className="bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl text-xs py-1.5 px-3 focus:outline-none"
          >
            <option value={1}>Monday</option>
            <option value={0}>Sunday</option>
          </select>
        </div>
      </section>

      {/* 3. TASK BEHAVIOR */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-subtle flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
          <Clock className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Task Workflow</h3>
        </div>

        {/* Default Priority */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)]">Default Priority</label>
            <p className="text-xs text-[var(--text-muted)]">Assigned to newly created tasks</p>
          </div>
          <select
            value={settings.default_priority}
            onChange={(e) =>
              updateSettings({ default_priority: e.target.value as PriorityLevel })
            }
            className="bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl text-xs py-1.5 px-3 focus:outline-none capitalize"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Default View Mode */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)]">Default Today View</label>
            <p className="text-xs text-[var(--text-muted)]">Layout style when opening the app</p>
          </div>
          <select
            value={settings.default_home_view}
            onChange={(e) =>
              updateSettings({ default_home_view: e.target.value as HomeViewMode })
            }
            className="bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl text-xs py-1.5 px-3 focus:outline-none capitalize"
          >
            <option value="list">Standard List</option>
            <option value="compact">Compact List</option>
            <option value="board">Kanban Board</option>
          </select>
        </div>

        {/* Show Completed Tasks */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)]">Show Completed Tasks</label>
            <p className="text-xs text-[var(--text-muted)]">Display completed section in task lists</p>
          </div>
          <input
            type="checkbox"
            checked={settings.show_completed_tasks}
            onChange={(e) => updateSettings({ show_completed_tasks: e.target.checked })}
            className="w-4 h-4 text-brand-600 rounded border-[var(--border-strong)] focus:ring-brand-500"
          />
        </div>

        {/* Confirm Delete */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)]">Confirm Before Delete</label>
            <p className="text-xs text-[var(--text-muted)]">Show dialog prior to deleting tasks</p>
          </div>
          <input
            type="checkbox"
            checked={settings.confirm_before_delete}
            onChange={(e) => updateSettings({ confirm_before_delete: e.target.checked })}
            className="w-4 h-4 text-brand-600 rounded border-[var(--border-strong)] focus:ring-brand-500"
          />
        </div>
      </section>

      {/* 4. KEYBOARD SHORTCUTS REFERENCE (Requirement 19) */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-subtle flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
          <Keyboard className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Keyboard Shortcuts</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {[
            { key: 'N', desc: 'Create new task' },
            { key: '/', desc: 'Focus search bar' },
            { key: 'T', desc: 'Go to Today page' },
            { key: 'C', desc: 'Open Calendar' },
            { key: 'Esc', desc: 'Close modal or panel' },
            { key: 'Ctrl + Enter', desc: 'Save task form' },
          ].map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]"
            >
              <span className="text-[var(--text-secondary)]">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded font-mono font-semibold bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </section>

      {/* 5. DATA MANAGEMENT & CLEAR */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-subtle flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
          <Download className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Data Portability & Backup</h3>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          Export your tasks and categories as a clean JSON backup file or import previously exported data.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportData}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export JSON
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            className="ml-auto"
          >
            Clear All Tasks
          </Button>
        </div>
      </section>

      {/* Clear All Data Confirm Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAllData}
        title="Clear All Task Data?"
        message="This action permanently deletes all your tasks and subtasks from Supabase. It cannot be undone."
        confirmText="Yes, delete everything"
        isLoading={isClearing}
      />
    </div>
  );
};
