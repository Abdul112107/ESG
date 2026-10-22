import React from 'react';
import { AlertCircle, FolderOpen, RefreshCw, Loader2 } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading platform metrics...',
  className = 'py-16'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-400">{message}</p>
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Failed to load data',
  message,
  onRetry,
  className = 'py-12'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 ${className}`}>
      <div className="p-3 bg-rose-500/15 text-rose-400 border border-rose-500/25 rounded-2xl mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600/25 border border-purple-500/30 rounded-xl hover:bg-purple-600/40 transition-colors bouncy-button"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({
  title,
  description,
  action,
  icon,
  className = 'py-16'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 ${className}`}>
      <div className="p-3 bg-white/[0.05] border border-white/[0.08] text-purple-400 rounded-2xl mb-3">
        {icon || <FolderOpen className="w-5 h-5" />}
      </div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-md">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
