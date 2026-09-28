import React, { useState, useEffect } from 'react';
import { Category, CategorizationRule, Transaction, TransactionType } from '../types';
import { autoCategorize, autoCategorizeWithAI } from '../utils/categorizer';
import { X, Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id'>, existingId?: string) => void;
  categories: Category[];
  userRules: CategorizationRule[];
  initialData?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  userRules,
  initialData,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('groceries');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<Transaction['paymentMethod']>('Debit Card');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const [autoMatchInfo, setAutoMatchInfo] = useState<{
    matched: boolean;
    categoryName: string;
    source: string;
  } | null>(null);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  // Sync state when editing or opening fresh
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setCategory(initialData.category);
      setDate(initialData.date);
      setPaymentMethod(initialData.paymentMethod);
      setNotes(initialData.notes || '');
      setIsRecurring(!!initialData.isRecurring);
      setAutoMatchInfo(null);
    } else {
      setDescription('');
      setAmount('');
      setType('expense');
      setCategory('groceries');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Debit Card');
      setNotes('');
      setIsRecurring(false);
      setAutoMatchInfo(null);
    }
    setAiNote(null);
  }, [initialData, isOpen]);

  // Real-time automated categorization as the user types
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);

    if (!initialData && val.trim().length >= 2) {
      const { categoryId, matchedBy } = autoCategorize(val, userRules, categories);
      if (matchedBy !== 'fallback') {
        setCategory(categoryId);
        const catObj = categories.find((c) => c.id === categoryId);
        // If it looks like income keyword, switch type
        if (categoryId === 'income') {
          setType('income');
        }
        setAutoMatchInfo({
          matched: true,
          categoryName: catObj?.name || categoryId,
          source: matchedBy === 'user-rule' ? 'Custom Rule' : 'Merchant Pattern',
        });
      } else {
        setAutoMatchInfo(null);
      }
    } else {
      setAutoMatchInfo(null);
    }
  };

  const handleAiSmartCategorize = async () => {
    if (!description.trim()) return;
    setIsAiLoading(true);
    setAiNote(null);
    try {
      const parsedAmount = parseFloat(amount) || undefined;
      const res = await autoCategorizeWithAI(description, parsedAmount);
      setCategory(res.categoryId);
      if (res.categoryId === 'income') {
        setType('income');
      }
      const catObj = categories.find((c) => c.id === res.categoryId);
      setAiNote(`AI suggested: ${catObj?.name || res.categoryId} (${res.explanation})`);
      setAutoMatchInfo({
        matched: true,
        categoryName: catObj?.name || res.categoryId,
        source: 'AI Assistant',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    onSave(
      {
        description: description.trim() || 'Untitled Transaction',
        amount: numAmount,
        type,
        category,
        date,
        paymentMethod,
        notes: notes.trim() || undefined,
        isRecurring,
        autoCategorized: !!autoMatchInfo?.matched,
      },
      initialData?.id
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialData ? 'Edit Transaction' : 'Log New Transaction'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated categorization active on merchant & description input.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-tight mb-1.5">
              Entry Type
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expense (Outflow)
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Income (Inflow)
              </button>
            </div>
          </div>

          {/* Amount & Date in one row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-tight mb-1.5">
                Amount ($ USD) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-tight mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
              />
            </div>
          </div>

          {/* Description with real-time auto categorization */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-tight">
                Description / Merchant *
              </label>
              <button
                type="button"
                onClick={handleAiSmartCategorize}
                disabled={isAiLoading || !description.trim()}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Use AI to parse complex or abbreviated statement descriptions"
              >
                {isAiLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>Smart AI Detect</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Starbucks, Trader Joe's, Uber, Bi-weekly Salary..."
              value={description}
              onChange={handleDescriptionChange}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />

            {/* Auto-categorization indicator (unboxed metadata, zero pill) */}
            {autoMatchInfo && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700">
                <Check className="w-3.5 h-3.5" />
                <span>Auto-categorized as: <strong className="font-semibold">{autoMatchInfo.categoryName}</strong></span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">{autoMatchInfo.source}</span>
              </div>
            )}
            {aiNote && (
              <p className="mt-1 text-xs text-slate-600 italic">
                {aiNote}
              </p>
            )}
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-tight mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              {categories
                .filter((c) => (type === 'income' ? c.type === 'income' : c.type !== 'income'))
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type.toUpperCase()})
                  </option>
                ))}
            </select>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-tight mb-1.5">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              >
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer (ACH)</option>
                <option value="Cash">Cash</option>
                <option value="Direct Deposit">Direct Deposit</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-medium text-slate-700">
                  Recurring Monthly Bill / Income
                </span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-tight mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Shared dinner with Alex, reimbursable work lunch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {initialData ? 'Save Changes' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
