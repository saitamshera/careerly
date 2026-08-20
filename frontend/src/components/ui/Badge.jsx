import React from 'react';

export function Badge({
  children,
  variant = 'neutral', // 'green' | 'orange' | 'amber' | 'red' | 'blue' | 'purple' | 'neutral'
  size = 'md', // 'sm' | 'md'
  className = '',
  icon: Icon,
  ...props
}) {
  const variantStyles = {
    green: 'bg-[#E8F0EA] text-[#315B45] border-[#D1E0D7]',
    orange: 'bg-[#F7E7DD] text-[#C9683A] border-[#F0D0BF]',
    amber: 'bg-[#FBF4E6] text-[#B9822E] border-[#F3E3C4]',
    red: 'bg-[#FDECEB] text-[#B83A35] border-[#F7CBC9]',
    blue: 'bg-[#EBF2F7] text-[#2C5E8A] border-[#D0E1F0]',
    purple: 'bg-[#F1ECF7] text-[#5E3F8A] border-[#DFD5ED]',
    neutral: 'bg-[#F7F4ED] text-[#5F625C] border-[#E3DED3]'
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[0.68rem]',
    md: 'px-2.5 py-0.5 text-xs'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
