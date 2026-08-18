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
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none gap-2';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs sm:text-sm',
    lg: 'px-5 py-2.5 text-sm sm:text-base font-bold'
  };

  const variantStyles = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm border border-emerald-600/30',
    secondary: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700',
    outline: 'bg-transparent hover:bg-emerald-50 text-emerald-700 border border-emerald-300 dark:hover:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
    ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
    danger: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm border border-rose-600/30'
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
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
