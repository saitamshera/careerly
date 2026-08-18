import React from 'react';

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className = ''
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800 ${className}`}>
      <div className="space-y-1">
        {eyebrow && (
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
