import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" mobileBottomSheet={false}>
      <div className="flex flex-col items-center text-center p-2">
        <div className={`p-3 rounded-full mb-3 ${isDestructive ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400' : 'bg-brand-50 text-brand-600'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
