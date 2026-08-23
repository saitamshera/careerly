import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from './Card';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = '',
  accent = 'green', // 'green' | 'blue' | 'orange' | 'purple' | 'neutral'
  to
}) {
  const accentStyles = {
    green: 'text-[#315B45] bg-[#E8F0EA] border-[#D1E0D7]',
    blue: 'text-[#2C5E8A] bg-[#EBF2F7] border-[#D0E1F0]',
    orange: 'text-[#C9683A] bg-[#F7E7DD] border-[#F0D0BF]',
    purple: 'text-[#5E3F8A] bg-[#F1ECF7] border-[#DFD5ED]',
    neutral: 'text-[#5F625C] bg-[#F7F4ED] border-[#E3DED3]'
  };

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#74766F]">
          {title}
        </span>
        {Icon && (
          <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${accentStyles[accent] || accentStyles.green}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-xl sm:text-2xl font-bold text-[#20211E] tracking-tight font-mono">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-[#5F625C] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="pt-2 border-t border-[#E3DED3] text-[0.7rem] font-medium text-[#74766F]">
          {trend}
        </div>
      )}
    </>
  );

  const interactiveClasses = to 
    ? "block outline-none hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-2 focus-visible:ring-[#315B45] focus-visible:ring-offset-2 transition-all duration-200" 
    : "";

  if (to) {
    return (
      <Link to={to} className={interactiveClasses}>
        <Card className={`space-y-2.5 p-4 h-full ${className} ${to ? 'border-[#E5E0D6] hover:border-[#D1E0D7]' : ''}`}>
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={`space-y-2.5 p-4 h-full ${className}`}>
      {content}
    </Card>
  );
}
