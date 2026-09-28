import React, { useState } from 'react';
import { Category, CategorizationRule, Transaction } from '../types';
import { autoCategorize } from '../utils/categorizer';
import { Plus, Trash2, Play, Sparkles, Check, ArrowRight, Shield } from 'lucide-react';

interface RulesManagerProps {
  userRules: CategorizationRule[];
  categories: Category[];
  transactions: Transaction[];
  onAddRule: (keyword: string, categoryId: string) => void;
  onDeleteRule: (id: string) => void;
  onBatchApplyRules: () => void;
}

export const RulesManager: React.FC<RulesManagerProps> = ({
  userRules,
  categories,
  transactions,
  onAddRule,
  onDeleteRule,
  onBatchApplyRules,
}) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('groceries');
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ categoryId: string; matchedBy: string } | null>(null);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    onAddRule(newKeyword.trim().toLowerCase(), newCategoryId);
    setNewKeyword('');
  };

  const handleTestRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    const res = autoCategorize(testInput, userRules, categories);
    setTestResult(res);
  };

  const handleRunBatch = () => {
    onBatchApplyRules();
    setBatchNotice(`Scanned ${transactions.length} transactions and applied active categorization rules.`);
    setTimeout(() => setBatchNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Automated Expense Categorization Rules
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The engine inspects incoming merchants & descriptions to automatically assign categories.
            </p>
          </div>
          <button
            onClick={handleRunBatch}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Apply Rules to All Records</span>
          </button>
        </div>

        {batchNotice && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{batchNotice}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Rule & Live Interactive Tester */}
        <div className="lg:col-span-5 space-y-6">
          {/* Create Rule Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Add Categorization Rule
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Whenever a transaction contains this keyword, it will be automatically tagged.
            </p>

            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                  Merchant / Keyword Match
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Philz, Trader Joe's, Delta, Steam..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                  Target Category
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                + Save Keyword Rule
              </button>
            </form>
          </div>

          {/* Rule Tester Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Interactive Rule Tester
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Verify how any merchant line is parsed by the categorization engine.
            </p>

            <form onSubmit={handleTestRule} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g. Starbucks Reserve Roastery"
                value={testInput}
                onChange={(e) => {
                  setTestInput(e.target.value);
                  if (!e.target.value.trim()) setTestResult(null);
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Test
              </button>
            </form>

            {testResult && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="text-slate-500">Output:</div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: categoryMap.get(testResult.categoryId)?.color || '#64748b' }}
                  />
                  <strong className="text-slate-900 font-semibold">
                    {categoryMap.get(testResult.categoryId)?.name || testResult.categoryId}
                  </strong>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 capitalize">{testResult.matchedBy}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Rules List */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Active Rules ({userRules.length})
              </h3>
              <span className="text-xs text-slate-500">
                Sorted by priority
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {userRules.map((rule) => {
                const cat = categoryMap.get(rule.categoryId);
                return (
                  <div
                    key={rule.id}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                        "{rule.keyword}"
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat?.color || '#64748b' }}
                        />
                        <span className="text-xs font-medium text-slate-800">
                          {cat?.name || rule.categoryId}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {rule.matchCount} matches
                      </span>
                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
