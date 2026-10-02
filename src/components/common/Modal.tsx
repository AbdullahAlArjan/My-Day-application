import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  mobileBottomSheet?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  mobileBottomSheet = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={
              mobileBottomSheet
                ? { y: '100%', opacity: 0.5 }
                : { scale: 0.95, opacity: 0 }
            }
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={
              mobileBottomSheet
                ? { y: '100%', opacity: 0 }
                : { scale: 0.95, opacity: 0 }
            }
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[var(--bg-surface)] border border-[var(--border-subtle)] ${
              mobileBottomSheet
                ? 'rounded-t-2xl sm:rounded-2xl max-h-[90vh]'
                : 'rounded-2xl max-h-[85vh]'
            } shadow-modal flex flex-col z-10 overflow-hidden`}
          >
            {/* Mobile Sheet Handle */}
            {mobileBottomSheet && (
              <div className="sm:hidden w-full flex justify-center pt-2.5 pb-1">
                <div className="w-10 h-1 bg-[var(--border-strong)] rounded-full" />
              </div>
            )}

            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between p-4 sm:p-5 border-b border-[var(--border-subtle)]">
                <div>
                  {title && (
                    <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content with scrolling */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
