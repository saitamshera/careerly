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
    <div className={`p-8 sm:p-10 text-center rounded-xl border border-dashed border-[#E3DED3] bg-[#FFFDF8] space-y-3 ${className}`}>
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-[#E8F0EA] border border-[#D1E0D7] mx-auto flex items-center justify-center text-[#315B45] shadow-2xs">
          <Icon className="w-5 h-5" />
        </div>
      )}

      <div className="max-w-sm mx-auto space-y-1">
        <h3 className="text-sm sm:text-base font-bold text-[#20211E]">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-[#5F625C] leading-relaxed">
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
