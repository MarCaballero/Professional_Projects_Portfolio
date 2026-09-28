import React, { useState, useMemo } from 'react';
import { Category, Transaction } from '../types';
import { formatCurrency, getDailySpendingLast30Days, getSixMonthHistory } from '../utils/financialCalculations';
import { PieChart, TrendingUp, BarChart2, Calendar } from 'lucide-react';

interface VisualChartsProps {
  transactions: Transaction[];
  categories: Category[];
  totalBudgetLimit: number;
}

export const VisualCharts: React.FC<VisualChartsProps> = ({
  transactions,
  categories,
  totalBudgetLimit,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'donut' | 'history' | 'velocity'>('donut');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  const categoryMap = useMemo(
    () => new Map<string, Category>(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Current Month Category Breakdown
  const currentMonthSpending = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const monthTxs = transactions.filter((t) => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() === curYear && d.getMonth() === curMonth && t.type === 'expense';
    });

    const totals: Record<string, number> = {};
    let totalExpense = 0;

    for (const tx of monthTxs) {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
      totalExpense += tx.amount;
    }

    const list = Object.entries(totals)
      .map(([catId, amount]) => {
        const cat = categoryMap.get(catId);
        return {
          categoryId: catId,
          name: cat?.name || catId,
          color: cat?.color || '#64748b',
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { list, totalExpense };
  }, [transactions, categoryMap]);

  // 6-Month History Data
  const sixMonthHistory = useMemo(() => {
    return getSixMonthHistory(transactions);
  }, [transactions]);

  // 30-Day Daily Spending Data
  const dailyPoints = useMemo(() => {
    return getDailySpendingLast30Days(transactions);
  }, [transactions]);

  // Donut SVG Math
  const donutSlices = useMemo(() => {
    const { list, totalExpense } = currentMonthSpending;
    if (totalExpense === 0 || list.length === 0) return [];

    let accumulatedAngle = 0;
    const radius = 90;
    const innerRadius = 58;
    const cx = 110;
    const cy = 110;

    return list.map((item) => {
      const sliceAngle = (item.amount / totalExpense) * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + sliceAngle;
      accumulatedAngle = endAngle;

      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const ix1 = cx + innerRadius * Math.cos(endRad);
      const iy1 = cy + innerRadius * Math.sin(endRad);
      const ix2 = cx + innerRadius * Math.cos(startRad);
      const iy2 = cy + innerRadius * Math.sin(startRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');

      return {
        ...item,
        pathData,
        startAngle,
        endAngle,
      };
    });
  }, [currentMonthSpending]);

  const activeSliceItem = useMemo(() => {
    if (!hoveredSlice) return null;
    return currentMonthSpending.list.find((i) => i.categoryId === hoveredSlice) || null;
  }, [hoveredSlice, currentMonthSpending]);

  // Max values for 6-month bar chart scaling
  const maxMonthValue = useMemo(() => {
    let max = 1000;
    for (const m of sixMonthHistory) {
      if (m.income > max) max = m.income;
      if (m.expenses > max) max = m.expenses;
    }
    return Math.ceil(max / 500) * 500;
  }, [sixMonthHistory]);

  // Max value for 30-day velocity chart
  const maxDailyValue = useMemo(() => {
    let max = 50;
    for (const d of dailyPoints) {
      if (d.amount > max) max = d.amount;
      if (d.rollingAvg > max) max = d.rollingAvg;
    }
    return Math.ceil(max / 50) * 50;
  }, [dailyPoints]);

  const dailyBudgetCap = totalBudgetLimit > 0 ? totalBudgetLimit / 30 : 100;

  return (
    <div className="space-y-6">
      {/* Chart Selector Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Financial Habit Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time visual monitoring of category distribution, daily velocity, and multi-month trends.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveChartTab('donut')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeChartTab === 'donut'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Category Share</span>
          </button>

          <button
            onClick={() => setActiveChartTab('velocity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeChartTab === 'velocity'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>30-Day Velocity</span>
          </button>

          <button
            onClick={() => setActiveChartTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeChartTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>6-Month Cashflow</span>
          </button>
        </div>
      </div>

      {/* Chart View 1: Donut Spending Breakdown */}
      {activeChartTab === 'donut' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* SVG Donut */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <svg
                viewBox="0 0 220 220"
                className="w-56 h-56 transform -rotate-90 select-none"
              >
                {donutSlices.map((slice) => {
                  const isHovered = hoveredSlice === slice.categoryId;
                  return (
                    <path
                      key={slice.categoryId}
                      d={slice.pathData}
                      fill={slice.color}
                      opacity={hoveredSlice && !isHovered ? 0.45 : 1}
                      className="transition-all duration-200 cursor-pointer stroke-white stroke-2"
                      onMouseEnter={() => setHoveredSlice(slice.categoryId)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {activeSliceItem ? (
                  <>
                    <span className="text-xs font-medium text-slate-500 truncate max-w-[120px]">
                      {activeSliceItem.name}
                    </span>
                    <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                      {formatCurrency(activeSliceItem.amount)}
                    </span>
                    <span className="text-xs font-mono font-medium text-emerald-700">
                      {activeSliceItem.percentage.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-medium uppercase tracking-tight text-slate-400">
                      Total Spend
                    </span>
                    <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                      {formatCurrency(currentMonthSpending.totalExpense)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {currentMonthSpending.list.length} categories
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Category Ranking Breakdown Table */}
            <div className="lg:col-span-7">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-tight mb-3">
                Top Spending Allocations
              </h3>
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-2">
                {currentMonthSpending.list.map((item) => {
                  const isHovered = hoveredSlice === item.categoryId;
                  return (
                    <div
                      key={item.categoryId}
                      onMouseEnter={() => setHoveredSlice(item.categoryId)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isHovered
                          ? 'border-slate-300 bg-slate-50 shadow-xs'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono tabular-nums shrink-0">
                        <span className="text-slate-500">{item.percentage.toFixed(1)}%</span>
                        <span className="font-semibold text-slate-900 w-20 text-right">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart View 2: 30-Day Daily Spending Velocity & Rolling Trend */}
      {activeChartTab === 'velocity' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                30-Day Outflow Velocity & 7-Day Rolling Trend
              </h3>
              <p className="text-xs text-slate-500">
                Daily spikes vs smoothed moving trendline and target budget pace.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-slate-300 inline-block" />
                <span>Daily Spend</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-emerald-600 inline-block" />
                <span>7-Day Moving Avg</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t border-dashed border-rose-500 inline-block" />
                <span>Daily Target ({formatCurrency(dailyBudgetCap)})</span>
              </span>
            </div>
          </div>

          {/* SVG Area & Line Chart */}
          <div className="relative pt-6">
            <svg
              viewBox="0 0 600 240"
              className="w-full h-64 overflow-visible select-none"
            >
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = 200 - pct * 180;
                const val = maxDailyValue * pct;
                return (
                  <g key={idx}>
                    <line
                      x1="40"
                      y1={y}
                      x2="590"
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x="32"
                      y={y + 3}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                      textAnchor="end"
                    >
                      ${Math.round(val)}
                    </text>
                  </g>
                );
              })}

              {/* Target daily line */}
              {(() => {
                const targetY = 200 - (dailyBudgetCap / maxDailyValue) * 180;
                if (targetY >= 20 && targetY <= 200) {
                  return (
                    <line
                      x1="40"
                      y1={targetY}
                      x2="590"
                      y2={targetY}
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.8"
                    />
                  );
                }
                return null;
              })()}

              {/* Daily Spend Bars */}
              {dailyPoints.map((pt, idx) => {
                const barWidth = 12;
                const x = 50 + idx * 18;
                const height = (pt.amount / maxDailyValue) * 180;
                const y = 200 - height;
                const isHovered = hoveredDayIndex === idx;

                return (
                  <g key={idx}>
                    <rect
                      x={x - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={Math.max(2, height)}
                      fill={isHovered ? '#0f172a' : '#cbd5e1'}
                      rx="2"
                      className="transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredDayIndex(idx)}
                      onMouseLeave={() => setHoveredDayIndex(null)}
                    />
                    {/* X-axis label every 5 days */}
                    {idx % 5 === 0 && (
                      <text
                        x={x}
                        y="218"
                        fill="#64748b"
                        fontSize="9"
                        fontFamily="JetBrains Mono"
                        textAnchor="middle"
                      >
                        {pt.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* 7-day Rolling Line */}
              {(() => {
                const pointsStr = dailyPoints
                  .map((pt, idx) => {
                    const x = 50 + idx * 18;
                    const y = 200 - (pt.rollingAvg / maxDailyValue) * 180;
                    return `${x},${y}`;
                  })
                  .join(' ');

                return (
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsStr}
                  />
                );
              })()}
            </svg>

            {/* Hover Tooltip Readout */}
            {hoveredDayIndex !== null && (
              <div className="absolute top-2 right-4 bg-slate-900 text-white p-3 rounded-lg text-xs font-mono shadow-lg border border-slate-700 pointer-events-none">
                <div className="text-slate-400 font-sans text-[11px] mb-1">
                  {dailyPoints[hoveredDayIndex].date}
                </div>
                <div>Spent: <strong className="text-white">{formatCurrency(dailyPoints[hoveredDayIndex].amount)}</strong></div>
                <div>7-Day Avg: <strong className="text-emerald-400">{formatCurrency(dailyPoints[hoveredDayIndex].rollingAvg)}</strong></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart View 3: 6-Month Cashflow Bar Chart */}
      {activeChartTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                6-Month Inflow vs Outflow Trajectory
              </h3>
              <p className="text-xs text-slate-500">
                Comparative volume across recent months with net savings differential.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
                <span>Income</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-slate-700 inline-block" />
                <span>Expenses</span>
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="pt-6">
            <svg
              viewBox="0 0 600 240"
              className="w-full h-64 overflow-visible select-none"
            >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = 200 - pct * 170;
                const val = maxMonthValue * pct;
                return (
                  <g key={idx}>
                    <line
                      x1="45"
                      y1={y}
                      x2="585"
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x="38"
                      y={y + 3}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                      textAnchor="end"
                    >
                      ${Math.round(val)}
                    </text>
                  </g>
                );
              })}

              {/* Monthly Grouped Bars */}
              {sixMonthHistory.map((m, idx) => {
                const groupX = 85 + idx * 85;
                const barWidth = 24;

                const incomeHeight = (m.income / maxMonthValue) * 170;
                const incomeY = 200 - incomeHeight;

                const expenseHeight = (m.expenses / maxMonthValue) * 170;
                const expenseY = 200 - expenseHeight;

                return (
                  <g key={m.monthKey}>
                    {/* Income Bar */}
                    <rect
                      x={groupX - barWidth - 2}
                      y={incomeY}
                      width={barWidth}
                      height={Math.max(2, incomeHeight)}
                      fill="#10b981"
                      rx="3"
                    />
                    {/* Expense Bar */}
                    <rect
                      x={groupX + 2}
                      y={expenseY}
                      width={barWidth}
                      height={Math.max(2, expenseHeight)}
                      fill="#334155"
                      rx="3"
                    />

                    {/* X-axis Label */}
                    <text
                      x={groupX}
                      y="218"
                      fill="#334155"
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {m.monthLabel}
                    </text>

                    {/* Net Savings Difference */}
                    <text
                      x={groupX}
                      y="232"
                      fill={m.netSavings >= 0 ? '#059669' : '#e11d48'}
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                      textAnchor="middle"
                    >
                      {m.netSavings >= 0 ? '+' : ''}${Math.round(m.netSavings)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
