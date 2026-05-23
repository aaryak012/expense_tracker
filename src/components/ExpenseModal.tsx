import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, AlignLeft, RefreshCw, Hash } from 'lucide-react';
import { Expense, Category, ExpenseFormData, CURRENCIES, RECURRENCE_INTERVALS } from '../types';

interface ExpenseModalProps {
  expense?: Expense | null;
  categories: Category[];
  onSave: (data: ExpenseFormData) => Promise<void>;
  onClose: () => void;
}

const emptyForm: ExpenseFormData = {
  title: '',
  amount: '',
  currency: 'USD',
  category_id: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  tags: '',
  is_recurring: false,
  recurrence_interval: 'monthly',
};

export default function ExpenseModal({ expense, categories, onSave, onClose }: ExpenseModalProps) {
  const [form, setForm] = useState<ExpenseFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        amount: String(expense.amount),
        currency: expense.currency,
        category_id: expense.category_id || '',
        date: expense.date,
        notes: expense.notes,
        tags: expense.tags.join(', '),
        is_recurring: expense.is_recurring,
        recurrence_interval: expense.recurrence_interval || 'monthly',
      });
    } else {
      setForm(emptyForm);
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof ExpenseFormData, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0D1526 0%, #080C18 100%)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <h2 className="text-lg font-semibold text-white">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Coffee at Starbucks"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm transition-all"
            />
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Amount *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                  placeholder="0.00"
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 text-sm transition-all appearance-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} className="bg-[#0D1526]">{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Category</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={form.category_id}
                  onChange={(e) => set('category_id', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white focus:outline-none focus:border-blue-500/50 text-sm transition-all appearance-none"
                >
                  <option value="" className="bg-[#0D1526]">Uncategorized</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#0D1526]">{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white focus:outline-none focus:border-blue-500/50 text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Notes</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Optional notes..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm transition-all resize-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Tags (comma separated)</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="coffee, work, lunch"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm transition-all"
              />
            </div>
          </div>

          {/* Recurring */}
          <div className="bg-white/3 rounded-xl p-4 border border-white/8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300 font-medium">Recurring Expense</span>
              </div>
              <button
                type="button"
                onClick={() => set('is_recurring', !form.is_recurring)}
                className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
                  form.is_recurring ? 'bg-blue-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                    form.is_recurring ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
            {form.is_recurring && (
              <select
                value={form.recurrence_interval}
                onChange={(e) => set('recurrence_interval', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 text-sm appearance-none"
              >
                {RECURRENCE_INTERVALS.map((r) => (
                  <option key={r.value} value={r.value} className="bg-[#0D1526]">{r.label}</option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold hover:from-blue-600 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                expense ? 'Update' : 'Add Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
