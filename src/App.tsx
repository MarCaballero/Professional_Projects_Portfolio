/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Category,
  CategoryBudget,
  CategorizationRule,
  SavingsGoal,
  Transaction,
} from './types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_BUDGETS,
  DEFAULT_RULES,
  DEFAULT_GOALS,
  generateDefaultTransactions,
} from './data/defaultData';
import { autoCategorize } from './utils/categorizer';
import {
  calculateFinancialMetrics,
  calculateBudgetStatuses,
  formatCurrency,
} from './utils/financialCalculations';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { TransactionLedger } from './components/TransactionLedger';
import { BudgetManager } from './components/BudgetManager';
import { VisualCharts } from './components/VisualCharts';
import { RulesManager } from './components/RulesManager';
import { GoalsAndTips } from './components/GoalsAndTips';
import { TransactionModal } from './components/TransactionModal';
import { AlertTriangle, ArrowRight, CheckCircle2, TrendingUp, Sparkles, Plus } from 'lucide-react';

const STORAGE_KEYS = {
  TRANSACTIONS: 'prospertrack_transactions_v1',
  CATEGORIES: 'prospertrack_categories_v1',
  BUDGETS: 'prospertrack_budgets_v1',
  RULES: 'prospertrack_rules_v1',
  GOALS: 'prospertrack_goals_v1',
};

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return generateDefaultTransactions();
  });

  // Categories state
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CATEGORIES;
  });

  // Category Budgets state
  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_BUDGETS;
  });

  // Categorization Rules state
  const [userRules, setUserRules] = useState<CategorizationRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RULES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_RULES;
  });

  // Goals state
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_GOALS;
  });

  // Modals & UI states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.error(e);
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(userRules));
    } catch (e) {
      console.error(e);
    }
  }, [userRules]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error(e);
    }
  }, [goals]);

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // Financial calculations
  const metrics = useMemo(() => {
    return calculateFinancialMetrics(transactions, categories);
  }, [transactions, categories]);

  const budgetStatuses = useMemo(() => {
    return calculateBudgetStatuses(transactions, budgets, categories);
  }, [transactions, budgets, categories]);

  // Over budget alert items
  const alertItems = useMemo(() => {
    return budgetStatuses.categoryStatuses.filter((s) => s.isExceeded || s.isWarning);
  }, [budgetStatuses]);

  // Handlers for Transactions
  const handleSaveTransaction = (
    data: Omit<Transaction, 'id'>,
    existingId?: string
  ) => {
    if (existingId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === existingId ? { ...data, id: existingId } : t))
      );
      showNotification('Transaction updated successfully.');
    } else {
      const newTx: Transaction = {
        ...data,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
      showNotification(`Recorded ${formatCurrency(newTx.amount)} entry.`);
    }
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showNotification('Entry removed from ledger.');
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    const dup: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: new Date().toISOString().split('T')[0],
      description: `${tx.description} (Copy)`,
    };
    setTransactions((prev) => [dup, ...prev]);
    showNotification(`Duplicated "${tx.description}".`);
  };

  const handleQuickAddPreset = (preset: {
    description: string;
    amount: number;
    category: string;
    type: 'expense' | 'income';
  }) => {
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: new Date().toISOString().split('T')[0],
      description: preset.description,
      amount: preset.amount,
      type: preset.type,
      category: preset.category,
      paymentMethod: preset.type === 'income' ? 'Direct Deposit' : 'Debit Card',
      autoCategorized: true,
    };
    setTransactions((prev) => [newTx, ...prev]);
    showNotification(`Quick-logged ${preset.description} (${formatCurrency(preset.amount)}).`);
  };

  // Handlers for Budgets
  const handleUpdateBudget = (
    categoryId: string,
    newLimit: number,
    alertThreshold: number
  ) => {
    setBudgets((prev) =>
      prev.map((b) =>
        b.categoryId === categoryId
          ? { ...b, monthlyLimit: newLimit, alertThresholdPercent: alertThreshold }
          : b
      )
    );
    showNotification('Updated monthly budget limit.');
  };

  const handleAddCategoryBudget = (categoryId: string, monthlyLimit: number) => {
    setBudgets((prev) => [
      ...prev,
      { categoryId, monthlyLimit, alertThresholdPercent: 85 },
    ]);
    showNotification('New category budget limit created.');
  };

  // Handlers for Rules
  const handleAddRule = (keyword: string, categoryId: string) => {
    const rule: CategorizationRule = {
      id: `rule-${Date.now()}`,
      keyword,
      categoryId,
      matchCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUserRules((prev) => [rule, ...prev]);
    showNotification(`Added automated rule for "${keyword}".`);
  };

  const handleDeleteRule = (id: string) => {
    setUserRules((prev) => prev.filter((r) => r.id !== id));
    showNotification('Categorization rule deleted.');
  };

  const handleBatchApplyRules = () => {
    let modifiedCount = 0;
    const ruleMatches: Record<string, number> = {};

    const updatedTransactions = transactions.map((tx) => {
      const { categoryId, matchedBy } = autoCategorize(tx.description, userRules, categories);
      if (matchedBy !== 'fallback' && categoryId !== tx.category) {
        modifiedCount++;
        ruleMatches[categoryId] = (ruleMatches[categoryId] || 0) + 1;
        return {
          ...tx,
          category: categoryId,
          autoCategorized: true,
        };
      }
      return tx;
    });

    setTransactions(updatedTransactions);
    showNotification(`Rules evaluated: categorized ${modifiedCount} transactions.`);
  };

  // Handlers for Goals
  const handleAddGoal = (goalData: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setGoals((prev) => [...prev, newGoal]);
    showNotification(`Created savings goal: "${newGoal.title}".`);
  };

  const handleContributeToGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
      )
    );
    // Also record a savings transfer transaction in ledger
    const targetGoal = goals.find((g) => g.id === goalId);
    const savingsTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: new Date().toISOString().split('T')[0],
      description: `Savings Contribution: ${targetGoal?.title || 'Goal Reserve'}`,
      amount,
      type: 'expense',
      category: 'savings',
      paymentMethod: 'Bank Transfer',
      notes: 'Automated transfer toward savings goal',
      autoCategorized: true,
    };
    setTransactions((prev) => [savingsTx, ...prev]);
    showNotification(`Contributed ${formatCurrency(amount)} to ${targetGoal?.title}.`);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    showNotification('Savings goal removed.');
  };

  // Reset to Demo Data
  const handleResetData = () => {
    if (window.confirm('Reset all transactions, budgets, rules, and goals to realistic demo baseline?')) {
      setTransactions(generateDefaultTransactions());
      setCategories(DEFAULT_CATEGORIES);
      setBudgets(DEFAULT_BUDGETS);
      setUserRules(DEFAULT_RULES);
      setGoals(DEFAULT_GOALS);
      showNotification('Reset to realistic demo dataset.');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['id', 'date', 'description', 'amount', 'type', 'category', 'paymentMethod', 'notes', 'isRecurring'];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      t.category,
      t.paymentMethod,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.isRecurring ? 'true' : 'false',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prospertrack_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exported transactions CSV.');
  };

  // CSV Import
  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length < 2) return;

        const imported: Transaction[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',');
          if (parts.length >= 4) {
            const date = parts[1]?.trim() || new Date().toISOString().split('T')[0];
            const description = parts[2]?.replace(/^"|"$/g, '').trim() || 'Imported Entry';
            const amount = parseFloat(parts[3]) || 0;
            const type = (parts[4]?.trim() as any) === 'income' ? 'income' : 'expense';
            let category = parts[5]?.trim() || 'misc';
            // Auto-categorize if uncategorized
            if (category === 'misc' || !category) {
              const matched = autoCategorize(description, userRules, categories);
              category = matched.categoryId;
            }

            imported.push({
              id: `tx-imp-${Date.now()}-${i}`,
              date,
              description,
              amount: Math.abs(amount),
              type,
              category,
              paymentMethod: 'Debit Card',
              autoCategorized: true,
            });
          }
        }

        if (imported.length > 0) {
          setTransactions((prev) => [...imported, ...prev]);
          showNotification(`Imported ${imported.length} transactions from CSV.`);
        }
      } catch (err) {
        alert('Could not parse CSV file. Ensure valid headers.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setIsModalOpen(true);
        }}
        onResetData={handleResetData}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
      />

      {/* Main Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Floating Notification Toast */}
        {statusNotification && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusNotification}</span>
          </div>
        )}

        {/* Global Financial KPI Cards */}
        <MetricCards
          metrics={metrics}
          totalBudgetLimit={budgetStatuses.totalBudgetLimit}
          totalBudgetSpent={budgetStatuses.totalBudgetSpent}
          onNavigateToBudgets={() => setActiveTab('budgets')}
          onNavigateToGoals={() => setActiveTab('goals')}
        />

        {/* Budget Alert Banner if approaching or over limit */}
        {alertItems.length > 0 && activeTab === 'overview' && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-semibold text-amber-900">
                  Budget Velocity Alert:
                </span>{' '}
                <span className="text-amber-800">
                  {alertItems.map((item) => `${item.categoryName} (${item.percentUsed.toFixed(0)}%)`).join(', ')} currently approaching or exceeding target limits.
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('budgets')}
              className="text-amber-900 font-semibold hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Manage Budgets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Views by Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Split Grid: Recent Ledger vs Spending Habit Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Recent Transactions Snapshot */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Recent Daily Transactions
                    </h2>
                    <p className="text-xs text-slate-500">
                      Latest recorded cash movements across all channels.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {transactions.slice(0, 6).map((tx) => {
                    const cat = categories.find((c) => c.id === tx.category);
                    const isIncome = tx.type === 'income';

                    return (
                      <div
                        key={tx.id}
                        className="py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {tx.description}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="font-mono tabular-nums">{tx.date}</span>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: cat?.color || '#94a3b8' }}
                              />
                              <span>{cat?.name || tx.category}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono font-semibold text-sm shrink-0 tabular-nums">
                          <span className={isIncome ? 'text-emerald-700' : 'text-slate-900'}>
                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setEditingTransaction(null);
                      setIsModalOpen(true);
                    }}
                    className="w-full py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record New Entry</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Visual Habit Donut Snapshot & Budget Bars */}
              <div className="lg:col-span-5 space-y-6">
                {/* Visual Chart Card */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Top Expense Allocations
                      </h2>
                      <p className="text-xs text-slate-500">
                        Current month outflow distribution.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('charts')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Detailed Charts</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Category Progress Bars */}
                  <div className="space-y-3 pt-1">
                    {budgetStatuses.categoryStatuses.slice(0, 5).map((status) => (
                      <div key={status.categoryId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                          <span className="font-sans font-medium text-slate-800">
                            {status.categoryName}
                          </span>
                          <span className="text-slate-500">
                            {formatCurrency(status.spent)} / {formatCurrency(status.limit)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              status.isExceeded
                                ? 'bg-rose-600'
                                : status.isWarning
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(100, status.percentUsed)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 50/30/20 Snapshot Card */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900">
                      50 / 30 / 20 Health Pulse
                    </h2>
                    <button
                      onClick={() => setActiveTab('goals')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                    >
                      Details & Roadmap
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 font-mono">
                    <span>Needs: <strong className="text-blue-700">{((metrics.needsSpend / (metrics.totalIncome || 1)) * 100).toFixed(0)}%</strong> (50% cap)</span>
                    <span aria-hidden="true">·</span>
                    <span>Wants: <strong className="text-purple-700">{((metrics.wantsSpend / (metrics.totalIncome || 1)) * 100).toFixed(0)}%</strong> (30% cap)</span>
                    <span aria-hidden="true">·</span>
                    <span>Savings: <strong className="text-emerald-700">{metrics.savingsRate.toFixed(0)}%</strong> (20% goal)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ledger View */}
        {activeTab === 'ledger' && (
          <TransactionLedger
            transactions={transactions}
            categories={categories}
            onOpenNewTransaction={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onDuplicateTransaction={handleDuplicateTransaction}
            onQuickAddPreset={handleQuickAddPreset}
          />
        )}

        {/* Budgets View */}
        {activeTab === 'budgets' && (
          <BudgetManager
            categoryStatuses={budgetStatuses.categoryStatuses}
            totalBudgetLimit={budgetStatuses.totalBudgetLimit}
            totalBudgetSpent={budgetStatuses.totalBudgetSpent}
            totalBudgetRemaining={budgetStatuses.totalBudgetRemaining}
            totalPercent={budgetStatuses.totalPercent}
            daysRemaining={metrics.daysRemainingInMonth}
            categories={categories}
            onUpdateBudget={handleUpdateBudget}
            onAddCategoryBudget={handleAddCategoryBudget}
          />
        )}

        {/* Charts View */}
        {activeTab === 'charts' && (
          <VisualCharts
            transactions={transactions}
            categories={categories}
            totalBudgetLimit={budgetStatuses.totalBudgetLimit}
          />
        )}

        {/* Categorization Rules View */}
        {activeTab === 'rules' && (
          <RulesManager
            userRules={userRules}
            categories={categories}
            transactions={transactions}
            onAddRule={handleAddRule}
            onDeleteRule={handleDeleteRule}
            onBatchApplyRules={handleBatchApplyRules}
          />
        )}

        {/* Goals & Actionable Tips View */}
        {activeTab === 'goals' && (
          <GoalsAndTips
            metrics={metrics}
            goals={goals}
            categories={categories}
            transactions={transactions}
            onAddGoal={handleAddGoal}
            onContributeToGoal={handleContributeToGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}
      </main>

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        categories={categories}
        userRules={userRules}
        initialData={editingTransaction}
      />
    </div>
  );
}
