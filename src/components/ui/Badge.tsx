import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'purple' | 'neutral' | 'blue';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
}) => {
  const variants = {
    success: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60',
    warning: 'bg-amber-950/60 text-amber-400 border border-amber-800/60',
    danger: 'bg-rose-950/60 text-rose-400 border border-rose-800/60',
    purple: 'bg-purple-950/60 text-purple-300 border border-purple-800/60',
    blue: 'bg-blue-950/60 text-blue-400 border border-blue-800/60',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider',
    md: 'text-xs px-2.5 py-1 rounded-full font-semibold',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 select-none font-sans', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};
