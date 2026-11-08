'use client';

import { useEffect } from 'react';
import { Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  isDark?: boolean;
}

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete item',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  isDark = true,
}: ConfirmDeleteDialogProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Dialog card */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl transition-all duration-150 animate-in fade-in zoom-in-95 select-none',
          isDark
            ? 'bg-[#1e1e1e] border-white/[0.1] text-white shadow-black/80'
            : 'bg-white border-black/[0.1] text-neutral-900 shadow-neutral-500/20'
        )}
      >
        {/* Close X button */}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 p-1 rounded-md transition-colors cursor-pointer',
            isDark
              ? 'text-gray-400 hover:text-white hover:bg-white/[0.08]'
              : 'text-gray-500 hover:text-black hover:bg-black/[0.06]'
          )}
        >
          <X className="size-4" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="size-10 rounded-xl bg-red-500/15 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
            <Trash2 className="size-5" />
          </div>
          <div className="space-y-1 pr-4">
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
              isDark
                ? 'bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] hover:text-white'
                : 'bg-black/[0.05] text-gray-700 hover:bg-black/[0.08] hover:text-black'
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-500 shadow-xs transition-colors cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteDialog;
