import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white border border-slate-200 rounded-lg max-w-md w-full shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${danger ? 'text-red-600' : 'text-[#1E3A5F]'}`} />
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-700 rounded"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-slate-600 leading-relaxed">{message}</div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-1.5 text-xs font-medium text-white rounded ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1E3A5F] hover:bg-[#162C49]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
