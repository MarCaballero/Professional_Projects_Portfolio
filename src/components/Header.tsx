import React from 'react';
import { Plus, Sparkles, RotateCcw, Download, Upload } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
  onResetData: () => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onResetData,
  onExportCSV,
  onImportCSV,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'ledger', label: 'Daily Ledger' },
    { id: 'budgets', label: 'Monthly Budgets' },
    { id: 'charts', label: 'Habit Analytics' },
    { id: 'rules', label: 'Auto-Categorize' },
    { id: 'goals', label: 'Goals & Strategy' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSV(file);
      e.target.value = '';
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar Contract: 3 zones */}
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3">
            <a
              href="#overview"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('overview');
              }}
              className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 group"
            >
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-base shadow-xs">
                P
              </span>
              <span>ProsperTrack</span>
            </a>
          </div>

          {/* Zone 2: 4-6 text navigation links with subtle underline */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`text-sm font-medium transition-colors py-1 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-emerald-700 border-b-2 border-emerald-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Log Entry</span>
            </button>

            <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={onExportCSV}
                title="Export Transactions as CSV"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Export CSV"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                title="Import Transactions CSV"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Import CSV"
              >
                <Upload className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                onClick={onResetData}
                title="Reset to Realistic Demo Data"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Reset demo data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
