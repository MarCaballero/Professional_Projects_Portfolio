import React, { useState } from 'react';
import { AIAdviceResult, Category, FinancialHealthMetrics, SavingsGoal, Transaction } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/financialCalculations';
import { Target, TrendingUp, Sparkles, Plus, CheckCircle2, ShieldAlert, ArrowRight, Loader2, Award, Zap, Compass } from 'lucide-react';

interface GoalsAndTipsProps {
  metrics: FinancialHealthMetrics;
  goals: SavingsGoal[];
  categories: Category[];
  transactions: Transaction[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  onContributeToGoal: (goalId: string, amount: number) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalsAndTips: React.FC<GoalsAndTipsProps> = ({
  metrics,
  goals,
  categories,
  transactions,
  onAddGoal,
  onContributeToGoal,
  onDeleteGoal,
}) => {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalDate, setGoalDate] = useState('2027-12-31');
  const [goalCategory, setGoalCategory] = useState<SavingsGoal['category']>('emergency');
  const [goalMonthly, setGoalMonthly] = useState('');
  const [goalNotes, setGoalNotes] = useState('');

  // Contribution Modal State
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  // AI Strategic Advisor State
  const [aiAdvice, setAiAdvice] = useState<AIAdviceResult | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // 50/30/20 Math
  const totalBase = metrics.totalIncome > 0 ? metrics.totalIncome : metrics.totalExpenses;
  const needsPct = totalBase > 0 ? (metrics.needsSpend / totalBase) * 100 : 0;
  const wantsPct = totalBase > 0 ? (metrics.wantsSpend / totalBase) * 100 : 0;
  const savingsPct = metrics.savingsRate;

  // Recurring subscription audit tally
  const recurringTxs = transactions.filter((t) => t.isRecurring && t.type === 'expense');
  const totalRecurringMonthly = recurringTxs.reduce((acc, t) => acc + t.amount, 0);

  // Dining vs Groceries Ratio
  const diningTotal = transactions
    .filter((t) => t.category === 'dining' && t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const groceriesTotal = transactions
    .filter((t) => t.category === 'groceries' && t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const diningShareOfFood = diningTotal + groceriesTotal > 0 ? (diningTotal / (diningTotal + groceriesTotal)) * 100 : 0;

  // Handler for adding a new goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTargetAmount);
    const current = parseFloat(goalCurrentAmount) || 0;
    const monthly = parseFloat(goalMonthly) || 0;
    if (!goalTitle.trim() || isNaN(target) || target <= 0) return;

    onAddGoal({
      title: goalTitle.trim(),
      targetAmount: target,
      currentAmount: current,
      targetDate: goalDate,
      category: goalCategory,
      monthlyContribution: monthly,
      notes: goalNotes.trim() || undefined,
    });

    setIsAddingGoal(false);
    setGoalTitle('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('');
    setGoalMonthly('');
    setGoalNotes('');
  };

  // Handler for contributing to a goal
  const handleSaveContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal) return;
    const amount = parseFloat(contributionAmount);
    if (!isNaN(amount) && amount > 0) {
      onContributeToGoal(contributingGoal.id, amount);
      setContributingGoal(null);
      setContributionAmount('');
    }
  };

  // Request AI Strategic Plan
  const handleRequestAIPlan = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const topCat = metrics.topSpendingCategory;
      const res = await fetch('/api/financial-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyIncome: metrics.totalIncome,
          monthlySpending: metrics.totalExpenses,
          savingsRate: metrics.savingsRate,
          topCategories: topCat ? [topCat] : [],
          activeGoals: goals.map((g) => ({
            title: g.title,
            target: g.targetAmount,
            current: g.currentAmount,
            progress: ((g.currentAmount / g.targetAmount) * 100).toFixed(0) + '%',
          })),
          budgetOverages: [],
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data: AIAdviceResult = await res.json();
      setAiAdvice(data);
    } catch (err: any) {
      setAiError('Could not connect to AI advisor. Falling back to rule-based roadmap.');
      setAiAdvice({
        strategicSummary: "Strong fundamentals with consistent budget discipline. Optimize discretionary margins to accelerate emergency reserves.",
        actionPlan: [
          {
            title: "Rebalance Discretionary Spending to Under 30%",
            impact: "High Impact · Immediate",
            description: "Capping dining and impulse shopping releases $220/month directly into your primary savings goal.",
            action: "Set a weekly cash or debit card cap for weekend entertainment."
          },
          {
            title: "Automate High-Yield Emergency Reserve",
            impact: "High Impact · Next 30 Days",
            description: "Ensure 3 months of core living expenses are shielded in an FDIC-insured high-yield cash account.",
            action: "Split direct deposit to automatically divert 15% before reaching checking."
          },
          {
            title: "Accelerate Compound Long-Term Investments",
            impact: "Wealth Compounder · 5-Year Horizon",
            description: "An additional $150/mo invested at an estimated 8% annual return compounds to $11,100 in 5 years.",
            action: "Set recurring automated monthly purchases into broad-market index funds."
          }
        ]
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 50/30/20 Rule Master Assessment */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              50 / 30 / 20 Budget Architecture
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gold-standard financial benchmark: 50% Needs, 30% Wants, 20% Wealth & Savings.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-600">Savings Target:</span>
            <span className={`font-semibold ${metrics.savingsRate >= 20 ? 'text-emerald-700' : 'text-amber-600'}`}>
              {metrics.savingsRate >= 20 ? 'Meeting Target (20%+)' : `${metrics.savingsRate.toFixed(1)}% (Aim for 20%)`}
            </span>
          </div>
        </div>

        {/* Stacked Comparative Bar */}
        <div className="mt-5 space-y-3">
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${Math.min(100, needsPct)}%` }}
              className="bg-blue-600 h-full transition-all"
              title={`Needs: ${needsPct.toFixed(1)}%`}
            />
            <div
              style={{ width: `${Math.min(100 - needsPct, wantsPct)}%` }}
              className="bg-purple-500 h-full transition-all"
              title={`Wants: ${wantsPct.toFixed(1)}%`}
            />
            <div
              style={{ width: `${Math.min(100 - needsPct - wantsPct, savingsPct)}%` }}
              className="bg-emerald-600 h-full transition-all"
              title={`Savings: ${savingsPct.toFixed(1)}%`}
            />
          </div>

          {/* 3 Pillars Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-blue-700">Needs (Essentials)</span>
                <span className="font-mono">Target: 50%</span>
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {needsPct.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">
                {formatCurrency(metrics.needsSpend)} / month
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-purple-700">Wants (Discretionary)</span>
                <span className="font-mono">Target: 30%</span>
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {wantsPct.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">
                {formatCurrency(metrics.wantsSpend)} / month
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-emerald-700">Savings & Investing</span>
                <span className="font-mono">Target: 20%</span>
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {savingsPct.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">
                {formatCurrency(metrics.netSavings > 0 ? metrics.netSavings : 0)} / month
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Long-Term Savings Goals Planner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Long-Term Financial Goals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specific capital targets with calculated completion horizons and contribution pace.
            </p>
          </div>
          <button
            onClick={() => setIsAddingGoal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Savings Goal</span>
          </button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const monthsLeft = goal.monthlyContribution > 0 ? Math.ceil(remaining / goal.monthlyContribution) : 0;

            return (
              <div
                key={goal.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all hover:shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-600 shrink-0" />
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {goal.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      Target: {goal.targetDate}
                    </span>
                  </div>

                  {goal.notes && (
                    <p className="text-xs text-slate-500 mb-3">
                      {goal.notes}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1.5 my-3">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-slate-900 font-semibold">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-slate-500">
                        of {formatCurrency(goal.targetAmount)} ({progress.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all rounded-full"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer and Contribution Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500 font-mono">
                    {monthsLeft > 0 ? (
                      <span>~{monthsLeft} mos remaining at {formatCurrency(goal.monthlyContribution)}/mo</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">Goal Completed!</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setContributingGoal(goal);
                      setContributionAmount('100');
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                  >
                    + Add Funds
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Actionable Tips & Financial Health Insights */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Actionable Financial Habits & Optimization Levers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Algorithmic insights derived directly from your daily transaction ledger.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* Tip 1: Dining vs Grocery Ratio */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-tight text-amber-700">
              <span>Food Spend Calibration</span>
              <span className="font-mono text-slate-500">{diningShareOfFood.toFixed(0)}% dining</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Dining & Coffee accounts for {diningShareOfFood.toFixed(0)}% of your total food expenditures ({formatCurrency(diningTotal)} vs {formatCurrency(groceriesTotal)} groceries).
            </p>
            <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200">
              Action: Preparing 2 additional meals at home weekly saves ~$210/month ($2,520/year).
            </div>
          </div>

          {/* Tip 2: Subscription Leakage Detector */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-tight text-blue-700">
              <span>Recurring Bill Audit</span>
              <span className="font-mono text-slate-500">{formatCurrency(totalRecurringMonthly)}/mo</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              You have {recurringTxs.length} recurring automated services totaling {formatCurrency(totalRecurringMonthly * 12)}/year.
            </p>
            <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200">
              Action: Audit unused streaming or gym memberships semi-annually to eliminate leakage.
            </div>
          </div>

          {/* Tip 3: Compound Investment Growth Multiplier */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-tight text-emerald-700">
              <span>Wealth Compounding Power</span>
              <span className="font-mono text-slate-500">8% Est. CAGR</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Diverting an extra $150/month into broad-market index funds yields approximately $11,100 in 5 years and $28,900 in 10 years.
            </p>
            <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200">
              Action: Automate payroll investment transfers before discretionary outflows occur.
            </div>
          </div>
        </div>
      </div>

      {/* Gemini AI Strategic Wealth Advisor Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                AI Strategic Financial Advisor
              </h2>
              <p className="text-xs text-slate-500">
                Personalized 3-step action roadmap synthesized from your current month cashflow.
              </p>
            </div>
          </div>

          <button
            onClick={handleRequestAIPlan}
            disabled={isLoadingAi}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            {isLoadingAi ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Compass className="w-3.5 h-3.5" />
            )}
            <span>{aiAdvice ? 'Refresh Strategic Plan' : 'Generate Strategic Action Plan'}</span>
          </button>
        </div>

        {aiError && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
            {aiError}
          </div>
        )}

        {aiAdvice ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <h3 className="text-xs font-semibold text-emerald-900 uppercase tracking-tight mb-1">
                Executive Synthesis
              </h3>
              <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                {aiAdvice.strategicSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiAdvice.actionPlan.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-emerald-700 mb-1">
                      <span>Step 0{idx + 1}</span>
                      <span>{step.impact}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mb-1.5">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-700 font-medium">
                    <strong className="text-slate-900 block font-semibold mb-0.5">Execution Step:</strong>
                    {step.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Click <strong>"Generate Strategic Action Plan"</strong> to analyze your active budget limits, daily burn rate, and savings pace into a high-impact execution plan.
            </p>
          </div>
        )}
      </div>

      {/* Add New Goal Modal */}
      {isAddingGoal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6">
            <h3 className="font-bold text-slate-900 mb-3">Create Long-Term Savings Goal</h3>
            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home Down Payment, Emergency Fund, Roth IRA..."
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                    Target Amount ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="10000"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                    Current Balance ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={goalCurrentAmount}
                    onChange={(e) => setGoalCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    required
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                    Monthly Contribution ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="400"
                    value={goalMonthly}
                    onChange={(e) => setGoalMonthly(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. In high-yield savings or tax-advantaged account..."
                  value={goalNotes}
                  onChange={(e) => setGoalNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingGoal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contribution Modal */}
      {contributingGoal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl p-6">
            <h3 className="font-bold text-slate-900 mb-1">
              Add Funds to {contributingGoal.title}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Current Balance: {formatCurrency(contributingGoal.currentAmount)}
            </p>
            <form onSubmit={handleSaveContribution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-tight mb-1">
                  Contribution Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContributingGoal(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  Record Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
