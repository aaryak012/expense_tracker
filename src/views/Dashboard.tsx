import { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Receipt,
  AlertTriangle, Clock, Plus, ArrowUpRight,
} from 'lucide-react';
import { Expense, Category, Budget } from '../types';
import { StatCard } from '../components/Card3D';
import Card3D from '../components/Card3D';

interface DashboardProps {
  expenses: Expense[];
  categories: Category[];
  budget: Budget | null;
  onAddExpense: () => void;
  onViewExpenses: () => void;
}

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function MiniDonut({ segments }: { segments: { color: string; value: number; label: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return (
    <div className="flex items-center justify-center h-32">
      <div className="text-slate-500 text-sm">No data</div>
    </div>
  );

  let cumulative = 0;
  const radius = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const offset = circumference - (cumulative / total) * circumference;
          cumulative += seg.value;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="16"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'all 0.6s ease' }}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{segments.length}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#94A3B8" fontSize="8">categories</text>
      </svg>
      <div className="space-y-1.5">
        {segments.slice(0, 5).map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-xs text-slate-400 truncate max-w-[80px]">{seg.label}</span>
            <span className="text-xs text-white font-medium ml-auto">{((seg.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ expenses, categories, budget, onAddExpense, onViewExpenses }: DashboardProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthExpenses = useMemo(() =>
    expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }), [expenses, currentMonth, currentYear]);

  const lastMonthExpenses = useMemo(() => {
    const lm = currentMonth === 0 ? 11 : currentMonth - 1;
    const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === lm && d.getFullYear() === ly;
    });
  }, [expenses, currentMonth, currentYear]);

  const totalThisMonth = useMemo(() => thisMonthExpenses.reduce((s, e) => s + e.amount, 0), [thisMonthExpenses]);
  const totalLastMonth = useMemo(() => lastMonthExpenses.reduce((s, e) => s + e.amount, 0), [lastMonthExpenses]);
  const trend = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0;
  const budgetAmount = budget?.total_budget || 0;
  const budgetUsed = budgetAmount > 0 ? (totalThisMonth / budgetAmount) * 100 : 0;
  const recurringTotal = useMemo(() =>
    thisMonthExpenses.filter((e) => e.is_recurring).reduce((s, e) => s + e.amount, 0),
    [thisMonthExpenses]);

  const categorySpend = useMemo(() => {
    const map: Record<string, { amount: number; category: Category }> = {};
    thisMonthExpenses.forEach((e) => {
      if (!e.category_id) return;
      const cat = categories.find((c) => c.id === e.category_id);
      if (!cat) return;
      if (!map[e.category_id]) map[e.category_id] = { amount: 0, category: cat };
      map[e.category_id].amount += e.amount;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [thisMonthExpenses, categories]);

  const recentExpenses = useMemo(() =>
    [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6),
    [expenses]);

  const donutSegments = categorySpend.map(({ amount, category }) => ({
    color: category.color,
    value: amount,
    label: category.name,
  }));

  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">{monthName} overview</p>
        </div>
        <button
          onClick={onAddExpense}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold hover:from-blue-600 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total This Month"
          value={formatCurrency(totalThisMonth)}
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: Math.round(trend), label: 'vs last month' }}
          color="#3B82F6"
          glowColor="#3B82F6"
        />
        <StatCard
          title="Transactions"
          value={String(thisMonthExpenses.length)}
          subvalue={`${expenses.length} total`}
          icon={<Receipt className="w-5 h-5" />}
          color="#22C55E"
          glowColor="#22C55E"
        />
        <StatCard
          title="Budget Used"
          value={budgetAmount > 0 ? `${budgetUsed.toFixed(0)}%` : 'No budget'}
          subvalue={budgetAmount > 0 ? `${formatCurrency(budgetAmount - totalThisMonth)} left` : 'Set a budget'}
          icon={budgetUsed > 90 ? <AlertTriangle className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          color={budgetUsed > 90 ? '#EF4444' : '#14B8A6'}
          glowColor={budgetUsed > 90 ? '#EF4444' : '#14B8A6'}
        />
        <StatCard
          title="Recurring"
          value={formatCurrency(recurringTotal)}
          subvalue={`${thisMonthExpenses.filter((e) => e.is_recurring).length} subscriptions`}
          icon={<Clock className="w-5 h-5" />}
          color="#F97316"
          glowColor="#F97316"
        />
      </div>

      {/* Budget Progress */}
      {budgetAmount > 0 && (
        <Card3D className="rounded-2xl" intensity={8}>
          <div
            className="rounded-2xl p-6 border border-white/8"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(6,9,18,0.8) 100%)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Monthly Budget</h3>
              <span className={`text-sm font-medium ${budgetUsed > 90 ? 'text-red-400' : budgetUsed > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {formatCurrency(totalThisMonth)} / {formatCurrency(budgetAmount)}
              </span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(budgetUsed, 100)}%`,
                  background: budgetUsed > 90
                    ? 'linear-gradient(90deg, #EF4444, #F97316)'
                    : budgetUsed > 70
                    ? 'linear-gradient(90deg, #F97316, #EAB308)'
                    : 'linear-gradient(90deg, #3B82F6, #22C55E)',
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-500">{budgetUsed.toFixed(1)}% used</span>
              <span className="text-xs text-slate-500">{(100 - budgetUsed).toFixed(1)}% remaining</span>
            </div>
          </div>
        </Card3D>
      )}

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by category */}
        <Card3D className="rounded-2xl" intensity={8}>
          <div
            className="rounded-2xl p-6 border border-white/8"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(6,9,18,0.8) 100%)' }}
          >
            <h3 className="text-white font-semibold mb-4">Spending by Category</h3>
            {donutSegments.length > 0 ? (
              <MiniDonut segments={donutSegments} />
            ) : (
              <div className="h-24 flex items-center justify-center text-slate-500 text-sm">
                No expenses this month
              </div>
            )}
            {categorySpend.length > 0 && (
              <div className="mt-4 space-y-2">
                {categorySpend.slice(0, 4).map(({ amount, category }) => (
                  <div key={category.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: category.color }} />
                    <span className="text-sm text-slate-400 flex-1">{category.name}</span>
                    <span className="text-sm font-medium text-white">{formatCurrency(amount)}</span>
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(amount / totalThisMonth) * 100}%`, background: category.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card3D>

        {/* Recent expenses */}
        <Card3D className="rounded-2xl" intensity={8}>
          <div
            className="rounded-2xl p-6 border border-white/8"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(6,9,18,0.8) 100%)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Recent Expenses</h3>
              <button
                onClick={onViewExpenses}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {recentExpenses.length === 0 ? (
                <div className="text-slate-500 text-sm py-4 text-center">No expenses yet</div>
              ) : (
                recentExpenses.map((expense) => {
                  const cat = categories.find((c) => c.id === expense.category_id);
                  return (
                    <div key={expense.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: cat ? `${cat.color}20` : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${cat ? cat.color + '30' : 'rgba(255,255,255,0.08)'}`,
                          color: cat?.color || '#94A3B8',
                        }}
                      >
                        {expense.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate">{expense.title}</div>
                        <div className="text-xs text-slate-500">{new Date(expense.date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">{formatCurrency(expense.amount, expense.currency)}</div>
                        {cat && <div className="text-xs" style={{ color: cat.color }}>{cat.name}</div>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card3D>
      </div>

      {/* Top categories overview */}
      {categorySpend.length > 0 && (
        <Card3D className="rounded-2xl" intensity={6}>
          <div
            className="rounded-2xl p-6 border border-white/8"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(6,9,18,0.8) 100%)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Category Breakdown</h3>
              <span className="text-xs text-slate-500">{monthName}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {categorySpend.slice(0, 5).map(({ amount, category }) => (
                <div
                  key={category.id}
                  className="rounded-xl p-4 border transition-all hover:scale-105 duration-200"
                  style={{ background: `${category.color}10`, borderColor: `${category.color}20` }}
                >
                  <div className="text-sm font-bold text-white mb-1">{formatCurrency(amount)}</div>
                  <div className="text-xs truncate" style={{ color: category.color }}>{category.name}</div>
                  <div className="mt-2 h-1 bg-white/5 rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(amount / totalThisMonth) * 100}%`, background: category.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card3D>
      )}
    </div>
  );
}
