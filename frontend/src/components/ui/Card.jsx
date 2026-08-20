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
    sm: 'p-3 sm:p-3.5',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6'
  };

  const hoverStyles = hover
    ? 'hover:border-[#D7D0C4] hover:shadow-xs transition-all duration-150 cursor-pointer'
    : '';

  return (
    <div
      className={`bg-[#FFFDF8] border border-[#E3DED3] rounded-xl shadow-2xs ${paddingStyles[padding] || paddingStyles.md} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-3 pb-3 border-b border-[#E3DED3] ${className}`}>
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-[#20211E] tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-[#5F625C] mt-0.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
