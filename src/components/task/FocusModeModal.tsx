import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Check, Sparkles } from 'lucide-react';
import type { Task } from '@/types/database';
import { Badge } from '@/components/common/Badge';

interface FocusModeModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (task: Task) => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  task,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60); // 25 mins pomodoro
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft]);

  if (!isOpen || !task) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[var(--bg-canvas)] flex flex-col items-center justify-between p-6 sm:p-12 select-none"
      >
        {/* Top bar */}
        <div className="w-full max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Focus Mode</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Center content */}
        <div className="flex flex-col items-center text-center max-w-lg w-full my-auto">
          {/* Category & Priority */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="priority" priority={task.priority} size="md" />
            {task.category && (
              <Badge variant="category" color={task.category.color} size="md">
                {task.category.name}
              </Badge>
            )}
          </div>

          {/* Task Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            {task.title}
          </h2>

          {task.description && (
            <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-md">
              {task.description}
            </p>
          )}

          {/* Large Minimal Timer */}
          <div className="text-6xl sm:text-7xl font-mono font-light tracking-tighter text-[var(--text-primary)] my-6">
            {timeDisplay}
          </div>

          {/* Timer controls */}
          <div className="flex items-center gap-4 mb-8">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className="w-12 h-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-elevated transition-transform active:scale-95"
            >
              {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsActive(false);
                setSecondsLeft(25 * 60);
              }}
              className="p-3 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Mark Complete Action */}
          <button
            type="button"
            onClick={() => {
              onComplete(task);
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-md transition-all active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Mark as Completed</span>
          </button>
        </div>

        {/* Bottom subtle message */}
        <div className="text-xs text-[var(--text-muted)]">
          One thing at a time. Minimize distractions and finish strong.
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
