import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, glow = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl transition-all duration-200',
        glow && 'hover:border-purple-500/40 hover:shadow-purple-950/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
