import React from 'react';

const Card = ({
  children,
  className = '',
  glass = false,
  hoverable = false,
  onClick,
  ...props
}) => {
  const glassClasses = glass
    ? 'glass-card'
    : 'bg-white border border-slate-200/80 shadow-sm';

  const hoverClasses = hoverable
    ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-6 ${glassClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-start justify-between pb-4 border-b border-slate-100 ${className}`}>
    <div>
      {title && <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>}
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="ml-4 shrink-0">{action}</div>}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`pt-4 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`pt-4 mt-4 border-t border-slate-100 flex items-center justify-between ${className}`}>
    {children}
  </div>
);

export default Card;
