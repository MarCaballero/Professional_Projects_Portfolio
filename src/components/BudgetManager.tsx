import React, { useState } from 'react';
import { Category, CategoryBudget } from '../types';
import { formatCurrency } from '../utils/financialCalculations';
import { Edit3, Plus, AlertTriangle, CheckCircle2, Sliders, X } from 'lucide-react';

interface BudgetStatusItem {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isExceeded: boolean;
  isWarning: boolean;
  alertThreshold: number;
}

interface BudgetManagerProps {
  categoryStatuses: BudgetStatusItem[];
  totalBudgetLimit: number;
  totalBudgetSpent: number;
  totalBudgetRemaining: number;
  totalPercent: number;
  daysRemaining: number;
  categories: Category[];
  onUpdateBudget: (categoryId: string, newLimit: number, alertThreshold: number) => void;
  onAddCategoryBudget: (categoryId: string, monthlyLimit: number) => void;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  categoryStatuses,
  totalBudgetLimit,
  totalBudgetSpent,
  totalBudgetRemaining,
  totalPercent,
  daysRemaining,
  categories,
  onUpdateBudget,
  onAddCategoryBudget,
}) => {
  const [editingBudget, setEditingBudget] = useState<BudgetStatusItem | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [editThreshold, setEditThreshold] = useState('85');

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newLimit, setNewLimit] = useState('');

  // Unbudgeted categories that don't have a budget yet
  const budgetedIds = new Set(categoryStatuses.map((s) => s.categoryId));
  const unbudgetedCategories = categories.filter(
    (c) => c.type !== 'income' && !budgetedIds.has(c.id)
  );

  const handleStartEdit = (item: BudgetStatusItem) => {
    setEditingBudget(item);
    setEditLimit(item.limit.toString());
    setEditThreshold(item.alertThreshold.toString());
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    const numLimit = parseFloat(editLimit);
    const numThresh = parseInt(editThreshold, 10);
    if (!isNaN(numLimit) && numLimit >= 0) {
      onUpdateBudget(editingBudget.categoryId, numLimit, isNaN(numThresh) ? 85 : numThresh);
    }
    setEditingBudget(null);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryId) return;
    const numLimit = parseFloat(newLimit);
    if (!isNaN(numLimit) && numLimit > 0) {
      onAddCategoryBudget(newCategoryId, numLimit);
      setIsAddingNew(false);
      setNewLimit('');
      setNewCategoryId('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Budget Ceiling Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Monthly Budget Limits & Velocity
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active monthly cap across all functional expense categories.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unbudgetedCategories.length > 0 && (
              <button
                onClick={() => {
                  setNewCategoryId(unbudgetedCategories[0].id);
                  setIsAddingNew(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category Limit</span>
              </button>
            )}
          </div>
        </div>

        {/* Master Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-600">
              Total Outflow: <strong className="text-slate-900 font-semibold">{formatCurrency(totalBudgetSpent)}</strong> of {formatCurrency(totalBudgetLimit)}
            </span>
            <span className={totalBudgetSpent > totalBudgetLimit ? 'text-rose-600 font-bold' : 'text-slate-700'}>
              {totalPercent.toFixed(1)}% consumed
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                totalBudgetSpent > totalBudgetLimit
                  ? 'bg-rose-600'
                  : totalPercent >= 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, totalPercent)}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500">
            <div>
              {totalBudgetRemaining >= 0 ? (
                <span>Remaining Buffer: <strong className="text-emerald-700 font-mono font-semibold">{formatCurrency(totalBudgetRemaining)}</strong></span>
              ) : (
                <span>Over-Budget by: <strong className="text-rose-600 font-mono font-semibold">{formatCurrency(Math.abs(totalBudgetRemaining))}</strong></span>
              )}
            </div>
            <div>
              {daysRemaining > 0 && totalBudgetRemaining > 0 && (
                <span>Daily safe allowance: <strong className="text-slate-900 font-mono font-semibold">{formatCurrency(totalBudgetRemaining / daysRemaining)}</strong>/day</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Budget Limits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryStatuses.map((item) => {
          const isOver = item.isExceeded;
          const isWarn = item.isWarning;
          const dailyRemaining = daysRemaining > 0 && item.remaining > 0 ? item.remaining / daysRemaining : 0;

          return (
            <div
              key={item.categoryId}
              className={`bg-white border rounded-xl p-5 shadow-xs transition-all hover:shadow-sm ${
                isOver
                  ? 'border-rose-300 ring-1 ring-rose-200'
                  : isWarn
                  ? 'border-amber-300'
                  : 'border-slate-200'
              }`}
            >
              {/* Category Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <h3 className="font-semibold text-sm text-slate-900">
                    {item.categoryName}
                  </h3>
                </div>
                <button
                  onClick={() => handleStartEdit(item)}
                  title="Customize Limit & Alert Threshold"
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Numbers */}
              <div className="flex items-baseline justify-between font-mono tabular-nums mb-2">
                <div className="text-lg font-bold text-slate-900">
                  {formatCurrency(item.spent)}
                </div>
                <div className="text-xs text-slate-500">
                  Limit: {formatCurrency(item.limit)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isOver
                      ? 'bg-rose-600'
                      : isWarn
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(100, item.percentUsed)}%` }}
                />
              </div>

              {/* Unboxed Metadata / Status with Separators */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 font-mono tabular-nums">
                <span>{item.percentUsed.toFixed(0)}% used</span>
                <span aria-hidden="true">·</span>
                {isOver ? (
                  <span className="text-rose-600 font-semibold">
                    +{formatCurrency(Math.abs(item.remaining))} over
                  </span>
                ) : (
                  <span className="text-emerald-700">
                    {formatCurrency(item.remaining)} left
                  </span>
                )}
                {dailyRemaining > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{formatCurrency(dailyRemaining)}/d</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">
                Adjust {editingBudget.categoryName} Limit
              </h3>
              <button
                onClick={() => setEditingBudget(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                  Monthly Limit ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    required
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                  Warning Alert Threshold (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Color transitions to amber when spending crosses this percentage.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  Update Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Category Budget Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Category Limit</h3>
              <button
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNew} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                  Category
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {unbudgetedCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                  Monthly Limit ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    required
                    placeholder="e.g. 150"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
