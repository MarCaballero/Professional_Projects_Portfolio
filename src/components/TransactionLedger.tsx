import React, { useState, useMemo } from 'react';
import { Category, Transaction } from '../types';
import { formatCurrency } from '../utils/financialCalculations';
import { Search, Plus, Trash2, Edit2, Copy, Filter, Calendar, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionLedgerProps {
  transactions: Transaction[];
  categories: Category[];
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDuplicateTransaction: (tx: Transaction) => void;
  onQuickAddPreset: (preset: { description: string; amount: number; category: string; type: 'expense' | 'income' }) => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  categories,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onDuplicateTransaction,
  onQuickAddPreset,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [dateFilter, setDateFilter] = useState<'current-month' | 'last-30' | 'all'>('current-month');

  const categoryMap = useMemo(
    () => new Map<string, Category>(categories.map((c) => [c.id, c])),
    [categories]
  );

  const presets = [
    { label: '+ Coffee $5.25', description: 'Morning Specialty Coffee', amount: 5.25, category: 'dining', type: 'expense' as const },
    { label: '+ Lunch $14.50', description: 'Quick Lunch Bowl', amount: 14.50, category: 'dining', type: 'expense' as const },
    { label: '+ Fuel $45.00', description: 'Chevron Fuel Fill-up', amount: 45.00, category: 'transport', type: 'expense' as const },
    { label: '+ Groceries $85.00', description: 'Trader Joe’s Market Run', amount: 85.00, category: 'groceries', type: 'expense' as const },
    { label: '+ Salary $2,450.00', description: 'Bi-Weekly Employer Direct Deposit', amount: 2450.00, category: 'income', type: 'income' as const },
  ];

  // Filtering transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return transactions
      .filter((tx) => {
        // Date filter
        if (dateFilter === 'current-month') {
          const d = new Date(tx.date + 'T00:00:00');
          if (d.getFullYear() !== curYear || d.getMonth() !== curMonth) return false;
        } else if (dateFilter === 'last-30') {
          const d = new Date(tx.date + 'T00:00:00');
          if (d < thirtyDaysAgo) return false;
        }

        // Type filter
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

        // Category filter
        if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchDesc = tx.description.toLowerCase().includes(term);
          const matchNotes = tx.notes?.toLowerCase().includes(term);
          const catName = categoryMap.get(tx.category)?.name.toLowerCase() || '';
          const matchCat = catName.includes(term);
          if (!matchDesc && !matchNotes && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, selectedCategory, typeFilter, dateFilter, categoryMap]);

  // Aggregate stats of filtered set
  const filteredStats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') income += tx.amount;
      else expenses += tx.amount;
    }
    return { income, expenses, count: filteredTransactions.length };
  }, [filteredTransactions]);

  return (
    <div className="space-y-4">
      {/* Quick Add Presets Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 tracking-tight">
          <span>Quick Log:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onQuickAddPreset(preset)}
              className="px-2.5 py-1 text-xs font-mono font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer tabular-nums whitespace-nowrap"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by merchant, note, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Date range segmented control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              onClick={() => setDateFilter('current-month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                dateFilter === 'current-month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('last-30')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                dateFilter === 'last-30'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                dateFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records
            </button>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Type tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'expense' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expenses Only
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'income' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Income Only
              </button>
            </div>

            {/* Category dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subtotal metrics (unboxed metadata with separators) */}
          <div className="flex items-center gap-2 text-slate-500 font-mono tabular-nums">
            <span>{filteredStats.count} entries</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-semibold">+{formatCurrency(filteredStats.income)}</span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-600 font-semibold">-{formatCurrency(filteredStats.expenses)}</span>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-slate-500 text-sm">
              No transactions match the selected filters or search query.
            </p>
            <div className="flex justify-center gap-2">
              {(searchTerm || selectedCategory !== 'all' || typeFilter !== 'all' || dateFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setTypeFilter('all');
                    setDateFilter('all');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={onOpenNewTransaction}
                className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                + Log Entry
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-500 tracking-tight">
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium">Description & Channel</th>
                  <th className="py-2.5 px-4 font-medium">Category</th>
                  <th className="py-2.5 px-4 font-medium text-right">Amount</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTransactions.map((tx) => {
                  const cat = categoryMap.get(tx.category);
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 transition-colors group h-12"
                    >
                      {/* Date */}
                      <td className="py-2.5 px-4 text-xs font-mono text-slate-600 whitespace-nowrap tabular-nums">
                        {tx.date}
                      </td>

                      {/* Description & metadata (unboxed, zero-pill) */}
                      <td className="py-2.5 px-4 max-w-md">
                        <div className="font-medium text-slate-900 truncate">
                          {tx.description}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                          <span>{tx.paymentMethod}</span>
                          {tx.isRecurring && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Recurring</span>
                            </>
                          )}
                          {tx.notes && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="italic">{tx.notes}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Category (unboxed text with color dot) */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || '#94a3b8' }}
                          />
                          <span className="font-medium">{cat?.name || tx.category}</span>
                          {tx.autoCategorized && (
                            <span className="text-[10px] text-slate-400 font-mono">auto</span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-4 text-right font-mono font-semibold whitespace-nowrap tabular-nums">
                        <span className={isIncome ? 'text-emerald-700' : 'text-slate-900'}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onDuplicateTransaction(tx)}
                            title="Duplicate Entry"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Edit Entry"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            title="Delete Entry"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
