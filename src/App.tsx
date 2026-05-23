import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { Expense, Category, Budget, View, ExpenseFormData, CategoryFormData, DEFAULT_CATEGORIES } from './types';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ExpenseModal from './components/ExpenseModal';
import CategoryModal from './components/CategoryModal';
import Dashboard from './views/Dashboard';
import ExpensesView from './views/ExpensesView';
import CategoriesView from './views/CategoriesView';
import AnalyticsView from './views/AnalyticsView';
import SettingsView from './views/SettingsView';
import type { User } from '@supabase/supabase-js';

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border transition-all duration-300 animate-slide-up ${
        type === 'success'
          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
          : 'bg-red-500/20 border-red-500/30 text-red-300'
      }`}
    >
      {message}
    </div>
  );
}

function RealtimeDot() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-400 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Live
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<View>('dashboard');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data
  const loadData = useCallback(async (userId: string) => {
    setDataLoading(true);
    const now = new Date();

    const [expensesRes, categoriesRes, budgetRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false }),
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name'),
      supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('month', now.getMonth() + 1)
        .eq('year', now.getFullYear())
        .maybeSingle(),
    ]);

    if (expensesRes.data) setExpenses(expensesRes.data);
    if (categoriesRes.data) {
      setCategories(categoriesRes.data);
      // Seed default categories if none exist
      if (categoriesRes.data.length === 0) {
        const toInsert = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId }));
        const { data: newCats } = await supabase.from('categories').insert(toInsert).select();
        if (newCats) setCategories(newCats);
      }
    }
    if (budgetRes.data) setBudget(budgetRes.data);

    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadData(user.id);

      // Real-time subscriptions
      const expenseChannel = supabase
        .channel('expenses-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setExpenses((prev) => [payload.new as Expense, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setExpenses((prev) => prev.map((e) => e.id === (payload.new as Expense).id ? payload.new as Expense : e));
          } else if (payload.eventType === 'DELETE') {
            setExpenses((prev) => prev.filter((e) => e.id !== (payload.old as Expense).id));
          }
        })
        .subscribe();

      const categoryChannel = supabase
        .channel('categories-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setCategories((prev) => [...prev, payload.new as Category].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === 'UPDATE') {
            setCategories((prev) => prev.map((c) => c.id === (payload.new as Category).id ? payload.new as Category : c));
          } else if (payload.eventType === 'DELETE') {
            setCategories((prev) => prev.filter((c) => c.id !== (payload.old as Category).id));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(expenseChannel);
        supabase.removeChannel(categoryChannel);
      };
    }
  }, [user, loadData]);

  // Expense operations
  const handleSaveExpense = async (formData: ExpenseFormData) => {
    if (!user) return;

    const payload = {
      user_id: user.id,
      title: formData.title.trim(),
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      category_id: formData.category_id || null,
      date: formData.date,
      notes: formData.notes,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      is_recurring: formData.is_recurring,
      recurrence_interval: formData.is_recurring ? formData.recurrence_interval : '',
    };

    if (editingExpense) {
      const { error } = await supabase.from('expenses').update(payload).eq('id', editingExpense.id);
      if (error) throw error;
      showToast('Expense updated');
    } else {
      const { error } = await supabase.from('expenses').insert(payload);
      if (error) throw error;
      showToast('Expense added');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) showToast('Failed to delete', 'error');
    else showToast('Expense deleted');
  };

  // Category operations
  const handleSaveCategory = async (formData: CategoryFormData) => {
    if (!user) return;

    const payload = {
      user_id: user.id,
      name: formData.name.trim(),
      color: formData.color,
      icon: formData.icon,
      budget: parseFloat(formData.budget) || 0,
    };

    if (editingCategory) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id);
      if (error) throw error;
      showToast('Category updated');
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) throw error;
      showToast('Category created');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) showToast('Failed to delete', 'error');
    else showToast('Category deleted');
  };

  const openAddExpense = () => { setEditingExpense(null); setExpenseModalOpen(true); };
  const openEditExpense = (e: Expense) => { setEditingExpense(e); setExpenseModalOpen(true); };
  const openAddCategory = () => { setEditingCategory(null); setCategoryModalOpen(true); };
  const openEditCategory = (c: Category) => { setEditingCategory(c); setCategoryModalOpen(true); };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#060912] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <div className="text-slate-500 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="flex h-screen bg-[#060912] overflow-hidden">
      <Sidebar activeView={view} onViewChange={setView} userName={userName} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-b border-white/6"
          style={{ background: 'rgba(6,9,18,0.8)', backdropFilter: 'blur(20px)' }}
        >
          <RealtimeDot />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {dataLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <div className="text-slate-500 text-sm">Loading your data...</div>
              </div>
            </div>
          ) : (
            <>
              {view === 'dashboard' && (
                <Dashboard
                  expenses={expenses}
                  categories={categories}
                  budget={budget}
                  onAddExpense={openAddExpense}
                  onViewExpenses={() => setView('expenses')}
                />
              )}
              {view === 'expenses' && (
                <ExpensesView
                  expenses={expenses}
                  categories={categories}
                  onAdd={openAddExpense}
                  onEdit={openEditExpense}
                  onDelete={handleDeleteExpense}
                />
              )}
              {view === 'categories' && (
                <CategoriesView
                  categories={categories}
                  expenses={expenses}
                  onAdd={openAddCategory}
                  onEdit={openEditCategory}
                  onDelete={handleDeleteCategory}
                />
              )}
              {view === 'analytics' && (
                <AnalyticsView expenses={expenses} categories={categories} />
              )}
              {view === 'settings' && (
                <SettingsView
                  userId={user.id}
                  budget={budget}
                  onBudgetUpdate={setBudget}
                  expenses={expenses}
                />
              )}
            </>
          )}
        </div>
      </main>

      {expenseModalOpen && (
        <ExpenseModal
          expense={editingExpense}
          categories={categories}
          onSave={handleSaveExpense}
          onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }}
        />
      )}

      {categoryModalOpen && (
        <CategoryModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => { setCategoryModalOpen(false); setEditingCategory(null); }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
