import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  disabled = false,
  isLoading = false,
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none gap-2';

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-xs font-semibold',
    lg: 'px-4 py-2.5 text-sm font-bold'
  };

  const variantStyles = {
    primary: 'bg-[#315B45] hover:bg-[#284A38] active:bg-[#203D2E] text-white shadow-2xs border border-[#284A38]/30',
    secondary: 'bg-[#FFFDF8] hover:bg-[#F7F4ED] active:bg-[#F4F1E9] text-[#20211E] border border-[#E3DED3] shadow-2xs',
    outline: 'bg-transparent hover:bg-[#E8F0EA] text-[#315B45] border border-[#315B45]',
    ghost: 'bg-transparent hover:bg-[#F7F4ED] text-[#5F625C] hover:text-[#20211E]',
    danger: 'bg-[#C9683A] hover:bg-[#B3592D] active:bg-[#9E4D25] text-white shadow-2xs border border-[#B3592D]/30'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
