import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react';
import { Expense, Category } from '../types';
import Card3D from '../components/Card3D';

interface AnalyticsViewProps {
  expenses: Expense[];
  categories: Category[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function BarChart({ data, color = '#3B82F6', maxVal }: { data: { label: string; value: number }[]; color?: string; maxVal?: number }) {
  const max = maxVal || Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((item, i) => {
        const pct = (item.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div className="relative w-full flex flex-col justify-end" style={{ height: '120px' }}>
              <div
                className="w-full rounded-t-lg transition-all duration-500 relative overflow-hidden"
                style={{ height: `${pct}%`, minHeight: item.value > 0 ? '4px' : '0', background: color }}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="text-xs text-slate-500 text-center leading-tight w-full truncate px-0.5">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LineChart({ data, color = '#3B82F6' }: { data: { label: string; value: number }[] }) {
  if (data.length < 2) return <div className="h-32 flex items-center justify-center text-slate-500 text-sm">Not enough data</div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 400;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const stepX = chartW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + chartH - (d.value / max) * chartH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: '120px' }}>
        <defs>
          <linearGradient id={`lineGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#lineGrad-${color.replace('#', '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} stroke="#060912" strokeWidth="2">
            <title>{data[i].label}: {formatCurrency(data[i].value)}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <div key={i} className="text-xs text-slate-600 text-center" style={{ width: `${100 / data.length}%` }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsView({ expenses, categories }: AnalyticsViewProps) {
  const [range, setRange] = useState<6 | 12>(6);

  const now = new Date();

  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const total = expenses
        .filter((e) => {
          const ed = new Date(e.date);
          return ed.getMonth() === month && ed.getFullYear() === year;
        })
        .reduce((s, e) => s + e.amount, 0);
      months.push({
        label: d.toLocaleString('default', { month: 'short' }),
        value: total,
        month,
        year,
      });
    }
    return months;
  }, [expenses, range, now]);

  const currentMonthTotal = monthlyData[monthlyData.length - 1]?.value || 0;
  const prevMonthTotal = monthlyData[monthlyData.length - 2]?.value || 0;
  const monthTrend = prevMonthTotal > 0 ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0;

  const avgMonthly = useMemo(() => {
    const nonZero = monthlyData.filter((m) => m.value > 0);
    if (nonZero.length === 0) return 0;
    return nonZero.reduce((s, m) => s + m.value, 0) / nonZero.length;
  }, [monthlyData]);

  const categoryBreakdown = useMemo(() => {
    const recentExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      return monthsAgo < range;
    });

    const map: Record<string, { amount: number; count: number; category: Category }> = {};
    recentExpenses.forEach((e) => {
      if (!e.category_id) return;
      const cat = categories.find((c) => c.id === e.category_id);
      if (!cat) return;
      if (!map[e.category_id]) map[e.category_id] = { amount: 0, count: 0, category: cat };
      map[e.category_id].amount += e.amount;
      map[e.category_id].count++;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [expenses, categories, range, now]);

  const totalSpend = categoryBreakdown.reduce((s, c) => s + c.amount, 0);

  const weekdayBreakdown = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = Array(7).fill(0);
    const amounts = Array(7).fill(0);
    expenses.forEach((e) => {
      const d = new Date(e.date).getDay();
      counts[d]++;
      amounts[d] += e.amount;
    });
    return days.map((label, i) => ({ label, value: amounts[i], count: counts[i] }));
  }, [expenses]);

  const topExpenses = useMemo(() =>
    [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5),
    [expenses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Insights into your spending patterns</p>
        </div>
        <div className="flex gap-2">
          {([6, 12] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                range === r
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {r}M
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Total Spend',
            value: formatCurrency(monthlyData.reduce((s, m) => s + m.value, 0)),
            sub: `Last ${range} months`,
            color: '#3B82F6',
            icon: <BarChart3 className="w-4 h-4" />,
          },
          {
            label: 'Avg Monthly',
            value: formatCurrency(avgMonthly),
            sub: 'Per month average',
            color: '#22C55E',
            icon: <Calendar className="w-4 h-4" />,
          },
          {
            label: 'Month Trend',
            value: `${monthTrend >= 0 ? '+' : ''}${monthTrend.toFixed(1)}%`,
            sub: 'vs previous month',
            color: monthTrend <= 0 ? '#22C55E' : '#EF4444',
            icon: monthTrend <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />,
          },
        ].map((item) => (
          <Card3D key={item.label} className="rounded-2xl" intensity={10}>
            <div
              className="rounded-2xl p-5 border border-white/8"
              style={{ background: `linear-gradient(135deg, ${item.color}10, rgba(6,9,18,0.9))` }}
            >
              <div
                className="p-2.5 rounded-xl w-fit mb-3"
                style={{ background: `${item.color}20`, color: item.color }}
              >
                {item.icon}
              </div>
              <div className="text-xl font-bold text-white">{item.value}</div>
              <div className="text-sm text-slate-400 mt-0.5">{item.label}</div>
              <div className="text-xs text-slate-600 mt-0.5">{item.sub}</div>
            </div>
          </Card3D>
        ))}
      </div>

      {/* Monthly trend + weekday */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card3D className="rounded-2xl" intensity={8}>
          <div
            className="rounded-2xl p-6 border border-white/8"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(6,9,18,0.9))' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Monthly Spending Trend</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs text-slate-500">Total</span>
              </div>
            </div>
            <LineChart data={monthlyData} color="#3B82F6" />
          </div>
        </Card3D>

        <Card3D className="rounded-2xl" intensity={8}>
          <div
            className="rounded-2xl p-6 border border-white/8"
            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(6,9,18,0.9))' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Spending by Day of Week</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-500">Avg spend</span>
              </div>
            </div>
            <BarChart data={weekdayBreakdown} color="#22C55E" />
          </div>
        </Card3D>
      </div>

      {/* Category breakdown */}
      <Card3D className="rounded-2xl" intensity={6}>
        <div
          className="rounded-2xl p-6 border border-white/8"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <h3 className="text-white font-semibold mb-5">Category Breakdown ({range}M)</h3>
          {categoryBreakdown.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">No categorized expenses in this period</div>
          ) : (
            <div className="space-y-4">
              {categoryBreakdown.map(({ amount, count, category }) => {
                const pct = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
                return (
                  <div key={category.id} className="flex items-center gap-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${category.color}20`, color: category.color }}
                    >
                      {category.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-medium">{category.name}</span>
                        <span className="text-sm font-semibold text-white">{formatCurrency(amount)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: category.color }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">{pct.toFixed(1)}%</span>
                        <span className="text-xs text-slate-600 flex-shrink-0">{count} txns</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card3D>

      {/* Top expenses */}
      <Card3D className="rounded-2xl" intensity={6}>
        <div
          className="rounded-2xl p-6 border border-white/8"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <h3 className="text-white font-semibold mb-5">Top Expenses (All Time)</h3>
          {topExpenses.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">No expenses yet</div>
          ) : (
            <div className="space-y-3">
              {topExpenses.map((expense, i) => {
                const cat = categories.find((c) => c.id === expense.category_id);
                return (
                  <div key={expense.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/3 transition-colors">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 border border-white/10">
                      {i + 1}
                    </div>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background: cat ? `${cat.color}20` : 'rgba(255,255,255,0.05)',
                        color: cat?.color || '#94A3B8',
                      }}
                    >
                      {expense.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{expense.title}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(expense.date).toLocaleDateString()} · {cat?.name || 'Uncategorized'}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-white">{formatCurrency(expense.amount)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card3D>
    </div>
  );
}
