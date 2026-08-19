import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export const EarlyAttentionBadge = ({ level, size = 'md', showIcon = true, className = '' }) => {
  let badgeConfig = {
    label: 'Normal Track',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-600/20',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    indicatorDot: 'bg-emerald-500',
  };

  if (level === 'HIGH_ATTENTION' || level === 'High Attention') {
    badgeConfig = {
      label: 'HIGH ATTENTION',
      bg: 'bg-rose-50 text-rose-800 border-rose-200 ring-rose-600/20',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
      indicatorDot: 'bg-rose-500 animate-pulse',
    };
  } else if (level === 'MODERATE_ATTENTION' || level === 'Moderate Attention') {
    badgeConfig = {
      label: 'MODERATE ATTENTION',
      bg: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/20',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      indicatorDot: 'bg-amber-500',
    };
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs font-semibold',
    lg: 'px-3.5 py-1.5 text-sm font-bold',
  }[size] || 'px-2.5 py-1 text-xs';

  const Icon = badgeConfig.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ring-1 font-medium transition-all ${badgeConfig.bg} ${sizeClasses} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${badgeConfig.indicatorDot}`} />
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{badgeConfig.label}</span>
    </span>
  );
};

export default EarlyAttentionBadge;
