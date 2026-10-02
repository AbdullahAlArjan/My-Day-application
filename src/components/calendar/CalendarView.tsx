import React, { useState } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { Task } from '@/types/database';
import { Button } from '@/components/common/Button';
import { getTodayDateString, formatFriendlyDate, formatTimeDisplay } from '@/lib/dateUtils';
import { useSettings } from '@/hooks/useSettings';

type CalendarViewMode = 'month' | 'week' | 'agenda';

interface CalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onDateClick: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onSelectTask,
  onDateClick,
}) => {
  const { settings } = useSettings();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  const weekStartsOn = (settings.first_day_of_week === 0 ? 0 : 1) as 0 | 1;

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  // Get tasks map by date string YYYY-MM-DD
  const tasksByDate = new Map<string, Task[]>();
  tasks.forEach((t) => {
    if (t.due_date) {
      const existing = tasksByDate.get(t.due_date) || [];
      existing.push(t);
      tasksByDate.set(t.due_date, existing);
    }
  });

  // Calculate Month Grid Days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn });
  const monthDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Calculate Week Grid Days
  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter tasks for Agenda View (upcoming or in the current month)
  const agendaTasks = [...tasks]
    .filter((t) => !!t.due_date)
    .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1));

  return (
    <div className="flex flex-col gap-4">
      {/* Calendar Top Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3.5 sm:p-4 rounded-2xl shadow-subtle">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="secondary" size="sm" onClick={handleGoToday}>
            Today
          </Button>
        </div>

        {/* View Switcher & Prev/Next */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-xl border border-[var(--border-subtle)]">
            {(['month', 'week', 'agenda'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 1. MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-subtle overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-center text-xs font-semibold text-[var(--text-muted)] py-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
              const adjustedIndex = (i + weekStartsOn) % 7;
              const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              return <div key={i}>{names[adjustedIndex]}</div>;
            })}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[var(--border-subtle)]">
            {monthDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDate.get(dateStr) || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);

              return (
                <div
                  key={dateStr}
                  onClick={() => onDateClick(dateStr)}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                    isCurrentMonth ? 'bg-[var(--bg-surface)]' : 'bg-[var(--bg-canvas)]/50 opacity-60'
                  } hover:bg-brand-50/20 dark:hover:bg-brand-950/10`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        isDayToday
                          ? 'bg-brand-600 text-white font-bold'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] p-0.5">
                      <Plus className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Task Pills */}
                  <div className="flex flex-col gap-1 my-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(task);
                        }}
                        className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1 transition-transform hover:scale-[1.02] ${
                          task.status === 'completed'
                            ? 'line-through bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                            : 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                        }`}
                        style={{
                          borderLeft: task.category?.color ? `2.5px solid ${task.category.color}` : undefined,
                        }}
                        title={task.title}
                      >
                        {task.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-[var(--text-muted)] font-medium pl-1">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDate.get(dateStr) || [];
            const isDayToday = isToday(day);

            return (
              <div
                key={dateStr}
                className={`bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-3 flex flex-col shadow-subtle min-h-[300px] ${
                  isDayToday ? 'ring-2 ring-brand-500/40' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] mb-2">
                  <div>
                    <span className="text-xs uppercase text-[var(--text-muted)] font-semibold block">
                      {format(day, 'EEE')}
                    </span>
                    <span className={`text-base font-bold ${isDayToday ? 'text-brand-600 dark:text-brand-400' : 'text-[var(--text-primary)]'}`}>
                      {format(day, 'd MMM')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDateClick(dateStr)}
                    className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Task list for this day */}
                <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
                  {dayTasks.length === 0 ? (
                    <span className="text-[11px] text-[var(--text-muted)] italic py-4 text-center">
                      No tasks
                    </span>
                  ) : (
                    dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className="p-2 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs cursor-pointer flex flex-col gap-1 transition-all"
                      >
                        <span
                          className={`font-medium ${
                            task.status === 'completed'
                              ? 'line-through text-[var(--text-muted)]'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.category && (
                          <span
                            className="text-[9px] font-semibold px-1.5 py-0.2 rounded w-fit"
                            style={{
                              backgroundColor: `${task.category.color}20`,
                              color: task.category.color,
                            }}
                          >
                            {task.category.name}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-subtle flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Chronological Task Agenda
          </h3>

          {agendaTasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--text-muted)]">
              No tasks with due dates found.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
              {agendaTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-[var(--bg-surface-hover)] rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        task.due_date === getTodayDateString()
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {formatFriendlyDate(task.due_date)}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        task.status === 'completed'
                          ? 'line-through text-[var(--text-muted)]'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.due_time && (
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeDisplay(task.due_time, settings.time_format)}
                      </span>
                    )}
                    {task.category && (
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${task.category.color}20`,
                          color: task.category.color,
                        }}
                      >
                        {task.category.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
