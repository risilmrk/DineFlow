import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'orange' | 'emerald' | 'rose' | 'sky' | 'purple';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
}) => {
  const iconColors = {
    default: 'text-slate-400 bg-slate-800/80',
    orange: 'text-orange-400 bg-orange-950/40 border border-orange-800/40',
    emerald: 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40',
    rose: 'text-rose-400 bg-rose-950/40 border border-rose-800/40',
    sky: 'text-sky-400 bg-sky-950/40 border border-sky-800/40',
    purple: 'text-purple-400 bg-purple-950/40 border border-purple-800/40',
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={clsx('p-2.5 rounded-xl', iconColors[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={clsx(
                'font-medium px-1.5 py-0.5 rounded',
                trend.isPositive ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
