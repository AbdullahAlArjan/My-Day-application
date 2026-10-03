import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Check, Sparkles, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task } from '@/types/database';
import { Badge } from '@/components/common/Badge';

interface FocusModeModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (task: Task) => void;
}

function playTimerChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    console.log('Audio chime not supported');
  }
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  task,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60); // 25 mins pomodoro
  const [isActive, setIsActive] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      playTimerChime();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft]);

  if (!isOpen || !task) return null;

  const setTimerPreset = (minutes: number) => {
    setIsActive(false);
    setInitialMinutes(minutes);
    setSecondsLeft(minutes * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleFinish = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch {
      // Confetti fallback
    }
    onComplete(task);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[var(--bg-canvas)] flex flex-col items-center justify-between p-6 sm:p-12 select-none overflow-y-auto"
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
        <div className="flex flex-col items-center text-center max-w-lg w-full my-auto py-6">
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
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md">
              {task.description}
            </p>
          )}

          {/* Timer presets */}
          <div className="flex items-center gap-2 mb-4">
            {[
              { m: 25, label: '25m Focus' },
              { m: 15, label: '15m Quick' },
              { m: 5, label: '5m Break' },
            ].map(({ m, label }) => (
              <button
                key={m}
                type="button"
                onClick={() => setTimerPreset(m)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  initialMinutes === m
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Large Minimal Timer */}
          <div className="text-6xl sm:text-7xl font-mono font-light tracking-tighter text-[var(--text-primary)] my-4">
            {timeDisplay}
          </div>

          {/* Timer controls */}
          <div className="flex items-center gap-4 mb-8">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className="w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-elevated transition-transform active:scale-95"
              aria-label={isActive ? 'Pause' : 'Play'}
            >
              {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsActive(false);
                setSecondsLeft(initialMinutes * 60);
              }}
              className="p-3.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] active:scale-95 transition-all"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Mark Complete Action */}
          <button
            type="button"
            onClick={handleFinish}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-md transition-all active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Mark as Completed</span>
          </button>
        </div>

        {/* Bottom subtle message */}
        <div className="text-xs text-[var(--text-muted)] text-center">
          One thing at a time. Minimize distractions and finish strong.
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
