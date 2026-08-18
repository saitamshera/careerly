import React from 'react';
import { Card } from './Card';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = '',
  accent = 'green' // 'green' | 'blue' | 'orange' | 'purple' | 'neutral'
}) {
  const accentStyles = {
    green: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800/40',
    blue: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-100 dark:border-sky-800/40',
    orange: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-800/40',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-800/40',
    neutral: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
  };

  return (
    <Card className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${accentStyles[accent] || accentStyles.green}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[0.72rem] font-medium text-slate-500 dark:text-slate-400">
          {trend}
        </div>
      )}
    </Card>
  );
}
