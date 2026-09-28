import { Category, CategoryBudget, FinancialHealthMetrics, SavingsGoal, Transaction } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${Math.round(amount)}`;
}

/**
 * Calculates current month summary metrics and financial health indicators
 */
export function calculateFinancialMetrics(
  transactions: Transaction[],
  categories: Category[],
  currentDate: Date = new Date()
): FinancialHealthMetrics {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Days in current month and elapsed days
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = Math.min(currentDate.getDate(), totalDaysInMonth);
  const daysRemainingInMonth = Math.max(0, totalDaysInMonth - currentDay);

  // Filter transactions for current month
  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  let totalIncome = 0;
  let totalExpenses = 0;
  let needsSpend = 0;
  let wantsSpend = 0;

  const categoryTotals: Record<string, number> = {};

  for (const t of monthTransactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      const cat = categoryMap.get(t.category);
      if (cat) {
        if (cat.type === 'need') needsSpend += t.amount;
        else if (cat.type === 'want') wantsSpend += t.amount;
      } else {
        wantsSpend += t.amount;
      }

      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  }

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.min(100, (netSavings / totalIncome) * 100)) : 0;

  // Daily average spend so far
  const dailyAverageSpend = currentDay > 0 ? totalExpenses / currentDay : 0;
  // Projected month-end spend
  const projectedMonthEndSpend = totalExpenses + dailyAverageSpend * daysRemainingInMonth;

  // Emergency runway in months (assuming base needs monthly spend)
  const monthlyBurn = totalExpenses > 0 ? totalExpenses : 2500;
  // Liquid emergency buffer estimation from savings goals or net positive reserves
  const emergencyFundRunwayMonths = monthlyBurn > 0 ? Math.max(0, (netSavings > 0 ? netSavings * 6 : 4000) / monthlyBurn) : 0;

  // Find top spending category
  let topCat: { name: string; amount: number; percentage: number } | null = null;
  let maxAmount = 0;
  for (const [catId, amount] of Object.entries(categoryTotals)) {
    if (amount > maxAmount) {
      maxAmount = amount;
      const catObj = categoryMap.get(catId);
      topCat = {
        name: catObj?.name || catId,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      };
    }
  }

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    needsSpend,
    wantsSpend,
    dailyAverageSpend,
    projectedMonthEndSpend,
    daysRemainingInMonth,
    emergencyFundRunwayMonths,
    topSpendingCategory: topCat,
  };
}

/**
 * Calculates budget status for each category in current month
 */
export function calculateBudgetStatuses(
  transactions: Transaction[],
  budgets: CategoryBudget[],
  categories: Category[],
  currentDate: Date = new Date()
) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth && t.type === 'expense';
  });

  const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  // Sum spending per category
  const spendingByCat: Record<string, number> = {};
  for (const t of currentMonthTransactions) {
    spendingByCat[t.category] = (spendingByCat[t.category] || 0) + t.amount;
  }

  let totalBudgetLimit = 0;
  let totalBudgetSpent = 0;

  const statuses = budgets.map((b) => {
    const spent = spendingByCat[b.categoryId] || 0;
    const remaining = b.monthlyLimit - spent;
    const percentUsed = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
    const isExceeded = spent > b.monthlyLimit;
    const isWarning = !isExceeded && percentUsed >= b.alertThresholdPercent;
    const category = catMap.get(b.categoryId);

    totalBudgetLimit += b.monthlyLimit;
    totalBudgetSpent += spent;

    return {
      categoryId: b.categoryId,
      categoryName: category?.name || b.categoryId,
      color: category?.color || '#64748b',
      icon: category?.icon || 'DollarSign',
      limit: b.monthlyLimit,
      spent,
      remaining,
      percentUsed,
      isExceeded,
      isWarning,
      alertThreshold: b.alertThresholdPercent,
    };
  });

  const totalPercent = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;

  return {
    categoryStatuses: statuses,
    totalBudgetLimit,
    totalBudgetSpent,
    totalBudgetRemaining: totalBudgetLimit - totalBudgetSpent,
    totalPercent,
    isOverTotal: totalBudgetSpent > totalBudgetLimit,
  };
}

/**
 * Calculates 6-month historical income vs expense comparison
 */
export function getSixMonthHistory(transactions: Transaction[], referenceDate: Date = new Date()) {
  const result: {
    monthKey: string;
    monthLabel: string;
    income: number;
    expenses: number;
    netSavings: number;
  }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const yr = d.getFullYear();
    const mo = d.getMonth();
    const monthKey = `${yr}-${String(mo + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('en-US', { month: 'short' });

    let income = 0;
    let expenses = 0;

    for (const t of transactions) {
      const td = new Date(t.date + 'T00:00:00');
      if (td.getFullYear() === yr && td.getMonth() === mo) {
        if (t.type === 'income') income += t.amount;
        else expenses += t.amount;
      }
    }

    result.push({
      monthKey,
      monthLabel,
      income,
      expenses,
      netSavings: income - expenses,
    });
  }

  return result;
}

/**
 * Calculates daily spending for the past 30 days
 */
export function getDailySpendingLast30Days(transactions: Transaction[], referenceDate: Date = new Date()) {
  const points: { date: string; label: string; amount: number; rollingAvg: number }[] = [];
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Create map of expenses by date string
  const expensesByDate: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'expense') {
      expensesByDate[t.date] = (expensesByDate[t.date] || 0) + t.amount;
    }
  }

  for (let i = 29; i >= 0; i--) {
    const dayDate = new Date(referenceDate.getTime() - i * oneDayMs);
    const dateStr = dayDate.toISOString().split('T')[0];
    const label = `${dayDate.getMonth() + 1}/${dayDate.getDate()}`;
    const amount = expensesByDate[dateStr] || 0;

    points.push({
      date: dateStr,
      label,
      amount,
      rollingAvg: 0,
    });
  }

  // Calculate 7-day rolling average
  for (let i = 0; i < points.length; i++) {
    const windowStart = Math.max(0, i - 6);
    const slice = points.slice(windowStart, i + 1);
    const sum = slice.reduce((acc, p) => acc + p.amount, 0);
    points[i].rollingAvg = parseFloat((sum / slice.length).toFixed(2));
  }

  return points;
}
