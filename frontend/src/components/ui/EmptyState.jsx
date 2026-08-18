import React from 'react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className = ''
}) {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm">
          <Icon className="w-6 h-6" />
        </div>
      )}

      <div className="max-w-sm mx-auto space-y-1">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionText && onAction && (
        <div className="pt-2">
          <Button size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
