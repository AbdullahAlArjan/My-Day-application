import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className={`absolute z-30 mt-1.5 w-48 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-modal py-1 focus:outline-none ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {items.map((item, index) => (
              <React.Fragment key={item.id || index}>
                {item.divider && (
                  <div className="h-px bg-[var(--border-subtle)] my-1" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors ${
                    item.danger
                      ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  {item.icon && <span className="text-[var(--text-muted)]">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
