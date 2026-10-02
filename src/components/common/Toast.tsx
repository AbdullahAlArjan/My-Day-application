import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  success: (message: string, action?: ToastMessage['action']) => void;
  error: (message: string, action?: ToastMessage['action']) => void;
  info: (message: string, action?: ToastMessage['action']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, action, duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastMessage = { id, type, title, message, action, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, action?: ToastMessage['action']) => {
      showToast({ type: 'success', message, action });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, action?: ToastMessage['action']) => {
      showToast({ type: 'error', message, action });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, action?: ToastMessage['action']) => {
      showToast({ type: 'info', message, action });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-modal text-sm"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {toast.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                {toast.type === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                {toast.type === 'info' && (
                  <Info className="w-4 h-4 text-brand-500 shrink-0" />
                )}
                <span className="text-[var(--text-primary)] truncate font-normal">
                  {toast.message}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 underline underline-offset-2 px-1 py-0.5"
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
