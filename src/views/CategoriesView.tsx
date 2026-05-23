import { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Category, Expense } from '../types';
import Card3D from '../components/Card3D';

interface CategoriesViewProps {
  categories: Category[];
  expenses: Expense[];
  onAdd: () => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function CategoriesView({ categories, expenses, onAdd, onEdit, onDelete }: CategoriesViewProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const categoryStats = useMemo(() => {
    const thisMonth = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    return categories.map((cat) => {
      const catExpenses = thisMonth.filter((e) => e.category_id === cat.id);
      const total = catExpenses.reduce((s, e) => s + e.amount, 0);
      const count = catExpenses.length;
      const budgetPct = cat.budget > 0 ? (total / cat.budget) * 100 : 0;
      return { cat, total, count, budgetPct };
    }).sort((a, b) => b.total - a.total);
  }, [categories, expenses, currentMonth, currentYear]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-slate-400 text-sm mt-1">{categories.length} categories configured</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold hover:from-blue-600 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div
          className="rounded-2xl border border-white/8 p-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-slate-600" />
          </div>
          <div className="text-white font-semibold mb-2">No categories yet</div>
          <div className="text-slate-500 text-sm mb-4">Create categories to organize your spending</div>
          <button
            onClick={onAdd}
            className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-500/30 transition-all"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categoryStats.map(({ cat, total, count, budgetPct }) => {
            const overBudget = cat.budget > 0 && budgetPct > 100;
            const nearBudget = cat.budget > 0 && budgetPct > 80 && !overBudget;

            return (
              <Card3D key={cat.id} className="rounded-2xl" intensity={12}>
                <div
                  className="rounded-2xl p-5 border relative group"
                  style={{
                    background: `linear-gradient(135deg, ${cat.color}10 0%, rgba(6,9,18,0.9) 100%)`,
                    borderColor: `${cat.color}20`,
                  }}
                >
                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {confirmDelete === cat.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { onDelete(cat.id); setConfirmDelete(null); }}
                          className="px-2 py-1 text-xs text-white bg-red-500 rounded-lg"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 text-xs text-slate-400 bg-white/5 rounded-lg"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(cat.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm"
                      style={{ background: `${cat.color}20`, color: cat.color, border: `1px solid ${cat.color}30` }}
                    >
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{cat.name}</div>
                      <div className="text-xs text-slate-500">{count} expenses this month</div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="text-xl font-bold text-white">{formatCurrency(total)}</div>
                      {cat.budget > 0 && (
                        <div className="text-xs text-slate-500">of {formatCurrency(cat.budget)} budget</div>
                      )}
                    </div>
                    {(overBudget || nearBudget) && (
                      <div
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
                          overBudget ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {overBudget ? 'Over budget' : 'Near limit'}
                      </div>
                    )}
                    {cat.budget === 0 && total > 0 && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <TrendingUp className="w-3 h-3" />
                        Active
                      </div>
                    )}
                  </div>

                  {/* Budget bar */}
                  {cat.budget > 0 && (
                    <div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(budgetPct, 100)}%`,
                            background: overBudget
                              ? 'linear-gradient(90deg, #EF4444, #F97316)'
                              : nearBudget
                              ? 'linear-gradient(90deg, #F97316, #EAB308)'
                              : cat.color,
                          }}
                        />
                      </div>
                      <div className="text-xs text-slate-600 mt-1">{budgetPct.toFixed(0)}% of budget</div>
                    </div>
                  )}

                  {/* Glow accent */}
                  <div
                    className="absolute bottom-0 left-4 right-4 h-px rounded-full"
                    style={{ background: `linear-gradient(90deg, transparent, ${cat.color}50, transparent)` }}
                  />
                </div>
              </Card3D>
            );
          })}
        </div>
      )}
    </div>
  );
}
