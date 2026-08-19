import React from 'react';

const Badge = ({
  children,
  variant = 'emerald',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    green: 'bg-green-50 text-green-700 border border-green-200/80',
    blue: 'bg-sky-50 text-sky-700 border border-sky-200/80',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/80',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    teal: 'bg-teal-50 text-teal-700 border border-teal-200/80',
  };

  const dotColors = {
    emerald: 'bg-emerald-500',
    green: 'bg-green-500',
    blue: 'bg-sky-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-400',
    teal: 'bg-teal-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${
        sizeStyles[size] || sizeStyles.md
      } ${variantStyles[variant] || variantStyles.emerald} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            dotColors[variant] || dotColors.emerald
          } animate-pulse`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
