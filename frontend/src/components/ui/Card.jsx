import React from 'react';

export function Card({
  children,
  className = '',
  hover = false,
  padding = 'md', // 'none' | 'sm' | 'md' | 'lg'
  ...props
}) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const hoverStyles = hover
    ? 'hover:border-slate-300 hover:shadow-md dark:hover:border-slate-600 transition-all duration-200 cursor-pointer'
    : '';

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm ${paddingStyles[padding] || paddingStyles.md} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 ${className}`}>
      <div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
