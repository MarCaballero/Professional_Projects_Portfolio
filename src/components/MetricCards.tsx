import React from 'react';
import { FinancialHealthMetrics } from '../types';
import { formatCurrency } from '../utils/financialCalculations';
import { ArrowUpRight, ArrowDownRight, TrendingUp, ShieldCheck, AlertCircle } from 'lucide-react';

interface MetricCardsProps {
  metrics: FinancialHealthMetrics;
  totalBudgetLimit: number;
  totalBudgetSpent: number;
  onNavigateToBudgets: () => void;
  onNavigateToGoals: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  metrics,
  totalBudgetLimit,
  totalBudgetSpent,
  onNavigateToBudgets,
  onNavigateToGoals,
}) => {
  const budgetUtilization = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;
  const isOverBudget = totalBudgetSpent > totalBudgetLimit;
  const budgetDifference = Math.abs(totalBudgetLimit - totalBudgetSpent);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Monthly Income */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-medium tracking-tight uppercase text-[11px] text-slate-500">Monthly Inflow</span>
          <span className="inline-flex items-center text-emerald-700 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            Active
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {formatCurrency(metrics.totalIncome)}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <span>Deposits Received</span>
          <span aria-hidden="true">·</span>
          <span>Sep 2026</span>
        </div>
      </div>

      {/* Card 2: Total Spending & Budget */}
      <div
        onClick={onNavigateToBudgets}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm cursor-pointer"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-medium tracking-tight uppercase text-[11px] text-slate-500">Monthly Outflow</span>
          <span className={`inline-flex items-center font-medium font-mono text-[11px] ${isOverBudget ? 'text-rose-600' : 'text-slate-600'}`}>
            {budgetUtilization.toFixed(0)}% of limit
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {formatCurrency(metrics.totalExpenses)}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <span>Limit: {formatCurrency(totalBudgetLimit)}</span>
          <span aria-hidden="true">·</span>
          <span className={isOverBudget ? 'text-rose-600 font-medium' : 'text-emerald-600'}>
            {isOverBudget ? `${formatCurrency(budgetDifference)} over` : `${formatCurrency(budgetDifference)} left`}
          </span>
        </div>
      </div>

      {/* Card 3: Net Savings Rate */}
      <div
        onClick={onNavigateToGoals}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm cursor-pointer"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-medium tracking-tight uppercase text-[11px] text-slate-500">Net Savings</span>
          <span className="inline-flex items-center text-emerald-700 font-mono text-[11px] font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
            {metrics.savingsRate.toFixed(1)}% rate
          </span>
        </div>
        <div className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${metrics.netSavings >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
          {formatCurrency(metrics.netSavings)}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <span>Target: 20.0%</span>
          <span aria-hidden="true">·</span>
          <span className={metrics.savingsRate >= 20 ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
            {metrics.savingsRate >= 20 ? 'On Track' : 'Below Standard'}
          </span>
        </div>
      </div>

      {/* Card 4: Daily Burn & Forecast */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-medium tracking-tight uppercase text-[11px] text-slate-500">Daily Velocity</span>
          <span className="inline-flex items-center text-slate-600 font-mono text-[11px]">
            {metrics.daysRemainingInMonth} days left
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {formatCurrency(metrics.dailyAverageSpend)}
          <span className="text-xs font-normal text-slate-500 tracking-normal ml-1">/day</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <span>Projected: {formatCurrency(metrics.projectedMonthEndSpend)}</span>
          <span aria-hidden="true">·</span>
          <span>Forecast</span>
        </div>
      </div>
    </div>
  );
};
