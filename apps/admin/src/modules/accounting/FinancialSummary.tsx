import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Landmark, Scale } from 'lucide-react';
import { HotelFinancialSummary } from '@dineflow/core';
import { StatCard } from '@dineflow/ui';

interface FinancialSummaryProps {
  summary: HotelFinancialSummary;
  currencySymbol: string;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ summary, currencySymbol }) => {
  const isNetPositive = summary.netOperatingResult >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Recorded Income"
        value={`${currencySymbol}${summary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        subtitle="Gross revenue recorded"
        icon={ArrowUpRight}
        variant="emerald"
      />

      <StatCard
        title="Recorded Expenses"
        value={`${currencySymbol}${summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        subtitle="Operating costs & inventory"
        icon={ArrowDownRight}
        variant="rose"
      />

      <StatCard
        title="Net Operating Result"
        value={`${currencySymbol}${summary.netOperatingResult.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        subtitle="Formula: Income - Expenses"
        icon={Scale}
        variant={isNetPositive ? 'emerald' : 'rose'}
        trend={{
          value: isNetPositive ? 'Profitable' : 'Deficit',
          isPositive: isNetPositive,
        }}
      />

      <StatCard
        title="Liquid Balances"
        value={`${currencySymbol}${(summary.totalCashBalance + summary.totalBankBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        subtitle={`Cash: ${currencySymbol}${summary.totalCashBalance.toFixed(0)} | Bank: ${currencySymbol}${summary.totalBankBalance.toFixed(0)}`}
        icon={Landmark}
        variant="sky"
      />
    </div>
  );
};
