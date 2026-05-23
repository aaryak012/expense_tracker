import { useState, useEffect } from 'react';
import { Save, DollarSign, Bell, Shield, Palette, Download } from 'lucide-react';
import { Budget } from '../types';
import { supabase } from '../lib/supabase';
import Card3D from '../components/Card3D';

interface SettingsViewProps {
  userId: string;
  budget: Budget | null;
  onBudgetUpdate: (budget: Budget) => void;
  expenses: import('../types').Expense[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function SettingsView({ userId, budget, onBudgetUpdate, expenses }: SettingsViewProps) {
  const [budgetAmount, setBudgetAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    if (budget) setBudgetAmount(String(budget.total_budget));
  }, [budget]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const amount = parseFloat(budgetAmount) || 0;

    if (budget) {
      const { data, error } = await supabase
        .from('budgets')
        .update({ total_budget: amount })
        .eq('id', budget.id)
        .select()
        .single();
      if (!error && data) onBudgetUpdate(data);
    } else {
      const { data, error } = await supabase
        .from('budgets')
        .insert({ user_id: userId, month: currentMonth, year: currentYear, total_budget: amount })
        .select()
        .single();
      if (!error && data) onBudgetUpdate(data);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Title', 'Amount', 'Currency', 'Category', 'Notes', 'Tags', 'Recurring'];
    const rows = expenses.map((e) => [
      e.date,
      `"${e.title.replace(/"/g, '""')}"`,
      e.amount,
      e.currency,
      '',
      `"${(e.notes || '').replace(/"/g, '""')}"`,
      (e.tags || []).join(';'),
      e.is_recurring ? 'Yes' : 'No',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${currentYear}-${String(currentMonth).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });
  const thisMonthTotal = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your preferences and data</p>
      </div>

      {/* Budget settings */}
      <Card3D className="rounded-2xl" intensity={8}>
        <div
          className="rounded-2xl p-6 border border-white/8"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(6,9,18,0.9))' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Monthly Budget</h3>
              <p className="text-slate-500 text-xs">Set your spending limit for {now.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Budget Amount (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  min="0"
                  step="0.01"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm"
                />
              </div>
            </div>
            {budget && (
              <div
                className="rounded-xl p-4 border border-white/8 text-sm"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">Spent this month</span>
                  <span className="text-white font-medium">{formatCurrency(thisMonthTotal)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-400">Remaining</span>
                  <span className={`font-medium ${budget.total_budget - thisMonthTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(budget.total_budget - thisMonthTotal)}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((thisMonthTotal / budget.total_budget) * 100, 100)}%`,
                      background: thisMonthTotal > budget.total_budget
                        ? 'linear-gradient(90deg, #EF4444, #F97316)'
                        : 'linear-gradient(90deg, #3B82F6, #22C55E)',
                    }}
                  />
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                saved
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
              }`}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Saved!' : 'Save Budget'}
            </button>
          </form>
        </div>
      </Card3D>

      {/* Data & Export */}
      <Card3D className="rounded-2xl" intensity={8}>
        <div
          className="rounded-2xl p-6 border border-white/8"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(6,9,18,0.9))' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Data Export</h3>
              <p className="text-slate-500 text-xs">Export your expense data</p>
            </div>
          </div>
          <div className="space-y-3">
            <div
              className="rounded-xl p-4 border border-white/8 text-sm"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Total expenses</span>
                <span className="text-white">{expenses.length} records</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total amount</span>
                <span className="text-white font-medium">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-all"
            >
              <Download className="w-4 h-4" />
              Export as CSV
            </button>
          </div>
        </div>
      </Card3D>

      {/* App info */}
      <Card3D className="rounded-2xl" intensity={8}>
        <div
          className="rounded-2xl p-6 border border-white/8"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-slate-500/20 text-slate-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold">About ExpenseOS</h3>
              <p className="text-slate-500 text-xs">App information</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ['Version', '2.0.0'],
              ['Database', 'Supabase (PostgreSQL)'],
              ['Real-time', 'Enabled'],
              ['Encryption', 'End-to-end secured'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-500">{k}</span>
                <span className="text-slate-300">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </Card3D>
    </div>
  );
}
