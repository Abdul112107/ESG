import React from 'react';
import { X } from 'lucide-react';

interface FormDialogProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  isLoading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  maxWidth?: string;
}

export const FormDialog: React.FC<FormDialogProps> = ({
  isOpen,
  title,
  subtitle,
  onClose,
  onSubmit,
  submitLabel = 'Save Record',
  isLoading = false,
  error,
  children,
  maxWidth = 'max-w-xl'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className={`bg-[#171131] rounded-3xl border border-purple-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] w-full ${maxWidth} overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 text-white`}>
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-purple-300/80 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.08] transition-colors bouncy-button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={onSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 font-medium">
                {error}
              </div>
            )}
            {children}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-white/[0.06] border border-white/10 rounded-full hover:bg-white/[0.1] hover:text-white transition-all disabled:opacity-50 bouncy-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full transition-all disabled:opacity-50 shadow-lg shadow-purple-600/30 bouncy-button"
            >
              {isLoading ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
