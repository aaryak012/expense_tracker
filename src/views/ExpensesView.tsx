import { useState, useMemo } from 'react';
import {
  Plus, Search, Filter, Trash2, Edit2, ArrowUpDown,
  Tag, Calendar, RefreshCw, X, ChevronDown, Receipt,
} from 'lucide-react';
import { Expense, Category } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  categories: Category[];
  onAdd: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

type SortKey = 'date' | 'amount' | 'title';
type SortDir = 'asc' | 'desc';

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export default function ExpensesView({ expenses, categories, onAdd, onEdit, onDelete }: ExpensesViewProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let result = [...expenses];
    if (search) result = result.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()) || e.notes?.toLowerCase().includes(search.toLowerCase()));
    if (filterCategory) result = result.filter((e) => e.category_id === filterCategory);
    if (filterMonth) {
      const [y, m] = filterMonth.split('-').map(Number);
      result = result.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      });
    }
    result.sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];
      if (sortKey === 'date') { aVal = new Date(aVal).getTime(); bVal = new Date(bVal).getTime(); }
      if (sortKey === 'amount') { aVal = Number(aVal); bVal = Number(bVal); }
      if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
    return result;
  }, [expenses, search, filterCategory, filterMonth, sortKey, sortDir]);

  const totalFiltered = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  const months = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      const d = new Date(e.date);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return [...set].sort().reverse();
  }, [expenses]);

  const SortIcon = ({ col }: { col: SortKey }) => (
    <ArrowUpDown className={`w-3.5 h-3.5 transition-colors ${sortKey === col ? 'text-blue-400' : 'text-slate-600'}`} />
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} transactions · {formatCurrency(totalFiltered)}</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold hover:from-blue-600 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 text-sm transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showFilters || filterCategory || filterMonth
              ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/8'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {(filterCategory || filterMonth) && (
            <span className="w-2 h-2 rounded-full bg-blue-400" />
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-white/8"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/40 text-sm appearance-none"
            >
              <option value="" className="bg-[#0D1526]">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0D1526]">{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/40 text-sm appearance-none"
            >
              <option value="" className="bg-[#0D1526]">All Months</option>
              {months.map((m) => {
                const [y, mo] = m.split('-');
                const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                return <option key={m} value={m} className="bg-[#0D1526]">{label}</option>;
              })}
            </select>
          </div>
          {(filterCategory || filterMonth) && (
            <button
              onClick={() => { setFilterCategory(''); setFilterMonth(''); }}
              className="col-span-full text-xs text-red-400 hover:text-red-300 text-left transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-2xl border border-white/8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(6,9,18,0.9) 100%)' }}
      >
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/6 text-xs text-slate-500 font-medium">
          <div className="col-span-5">
            <button onClick={() => handleSort('title')} className="flex items-center gap-1.5 hover:text-slate-300 transition-colors">
              Expense <SortIcon col="title" />
            </button>
          </div>
          <div className="col-span-2 hidden sm:block">Category</div>
          <div className="col-span-2">
            <button onClick={() => handleSort('date')} className="flex items-center gap-1.5 hover:text-slate-300 transition-colors">
              Date <SortIcon col="date" />
            </button>
          </div>
          <div className="col-span-2">
            <button onClick={() => handleSort('amount')} className="flex items-center gap-1.5 hover:text-slate-300 transition-colors">
              Amount <SortIcon col="amount" />
            </button>
          </div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <div className="text-slate-400 font-medium">No expenses found</div>
            <div className="text-slate-600 text-sm mt-1">
              {search || filterCategory || filterMonth ? 'Try adjusting your filters' : 'Add your first expense'}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {filtered.map((expense) => {
              const cat = categories.find((c) => c.id === expense.category_id);
              return (
                <div
                  key={expense.id}
                  className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/3 transition-colors group"
                >
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background: cat ? `${cat.color}20` : 'rgba(255,255,255,0.05)',
                        color: cat?.color || '#94A3B8',
                        border: `1px solid ${cat ? cat.color + '20' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      {expense.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-white font-medium truncate">{expense.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {expense.is_recurring && (
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <RefreshCw className="w-2.5 h-2.5" /> {expense.recurrence_interval}
                          </span>
                        )}
                        {expense.tags?.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 hidden sm:flex items-center">
                    {cat ? (
                      <span
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}25` }}
                      >
                        {cat.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(expense)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {confirmDelete === expense.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { onDelete(expense.id); setConfirmDelete(null); }}
                          className="px-2 py-1 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 text-xs text-slate-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(expense.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/6 flex items-center justify-between">
            <span className="text-xs text-slate-500">{filtered.length} expenses</span>
            <span className="text-sm font-semibold text-white">Total: {formatCurrency(totalFiltered)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

