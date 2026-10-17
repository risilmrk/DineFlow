import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  change?: string;
  isPositive?: boolean;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  isPositive = true,
  accentColor = 'orange',
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg transition-all hover:border-slate-700/80 hover:shadow-orange-950/10">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</p>
        <div className={`p-2.5 rounded-xl bg-${accentColor}-500/10 text-${accentColor}-400 border border-${accentColor}-500/20`}>
          <Icon className="w-5 h-5 text-orange-400" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
        {change && (
          <span
            className={`text-xs font-semibold ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {change}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
