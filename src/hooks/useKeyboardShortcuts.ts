import { useEffect } from 'react';

interface ShortcutHandlers {
  onNewTask?: () => void;
  onFocusSearch?: () => void;
  onGoToToday?: () => void;
  onOpenCalendar?: () => void;
  onEscape?: () => void;
  onSave?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Ctrl+Enter or Cmd+Enter to save (allowed even in input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (handlers.onSave) {
          e.preventDefault();
          handlers.onSave();
          return;
        }
      }

      if (!e.key) return;

      // Escape is always allowed to dismiss modals
      if (e.key === 'Escape') {
        if (handlers.onEscape) {
          e.preventDefault();
          handlers.onEscape();
          return;
        }
      }

      // If user is currently typing in an input, do not trigger single-letter shortcuts
      if (isInput) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          if (!e.ctrlKey && !e.metaKey && !e.altKey && handlers.onNewTask) {
            e.preventDefault();
            handlers.onNewTask();
          }
          break;
        case '/':
          if (!e.ctrlKey && !e.metaKey && !e.altKey && handlers.onFocusSearch) {
            e.preventDefault();
            handlers.onFocusSearch();
          }
          break;
        case 't':
          if (!e.ctrlKey && !e.metaKey && !e.altKey && handlers.onGoToToday) {
            e.preventDefault();
            handlers.onGoToToday();
          }
          break;
        case 'c':
          if (!e.ctrlKey && !e.metaKey && !e.altKey && handlers.onOpenCalendar) {
            e.preventDefault();
            handlers.onOpenCalendar();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
