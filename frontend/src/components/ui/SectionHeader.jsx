import React from 'react';

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className = ''
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#E3DED3] ${className}`}>
      <div className="space-y-1">
        {eyebrow && (
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#315B45] block">
            {eyebrow}
          </span>
        )}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#20211E] flex items-center gap-2">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[#5F625C] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
