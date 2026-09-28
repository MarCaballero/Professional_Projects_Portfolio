export type TransactionType = 'expense' | 'income';

export type BudgetType = 'need' | 'want' | 'savings';

export interface Category {
  id: string;
  name: string;
  type: BudgetType | 'income';
  color: string;
  icon: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  category: string; // Category id or name
  paymentMethod: 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Cash' | 'Direct Deposit';
  notes?: string;
  isRecurring?: boolean;
  autoCategorized?: boolean;
}

export interface CategoryBudget {
  categoryId: string;
  monthlyLimit: number;
  alertThresholdPercent: number; // e.g. 85
}

export interface CategorizationRule {
  id: string;
  keyword: string;
  categoryId: string;
  matchCount: number;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: 'emergency' | 'retirement' | 'purchase' | 'investment' | 'travel' | 'debt';
  monthlyContribution: number;
  notes?: string;
  createdAt: string;
}

export interface AIActionStep {
  title: string;
  impact: string;
  description: string;
  action: string;
}

export interface AIAdviceResult {
  strategicSummary: string;
  actionPlan: AIActionStep[];
}

export interface FinancialHealthMetrics {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number; // percentage (0-100)
  needsSpend: number;
  wantsSpend: number;
  dailyAverageSpend: number;
  projectedMonthEndSpend: number;
  daysRemainingInMonth: number;
  emergencyFundRunwayMonths: number;
  topSpendingCategory: { name: string; amount: number; percentage: number } | null;
}
