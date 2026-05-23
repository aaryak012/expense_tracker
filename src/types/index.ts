export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  budget: number;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  amount: number;
  currency: string;
  date: string;
  notes: string;
  tags: string[];
  receipt_url: string;
  is_recurring: boolean;
  recurrence_interval: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  month: number;
  year: number;
  total_budget: number;
  created_at: string;
}

export type View = 'dashboard' | 'expenses' | 'categories' | 'analytics' | 'settings';

export interface ExpenseFormData {
  title: string;
  amount: string;
  currency: string;
  category_id: string;
  date: string;
  notes: string;
  tags: string;
  is_recurring: boolean;
  recurrence_interval: string;
}

export interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
  budget: string;
}

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];

export const RECURRENCE_INTERVALS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#EF4444', icon: 'utensils' },
  { name: 'Transportation', color: '#F97316', icon: 'car' },
  { name: 'Shopping', color: '#EAB308', icon: 'shopping-bag' },
  { name: 'Entertainment', color: '#22C55E', icon: 'film' },
  { name: 'Health', color: '#14B8A6', icon: 'heart' },
  { name: 'Housing', color: '#3B82F6', icon: 'home' },
  { name: 'Education', color: '#8B5CF6', icon: 'book' },
  { name: 'Travel', color: '#EC4899', icon: 'plane' },
  { name: 'Utilities', color: '#64748B', icon: 'zap' },
  { name: 'Other', color: '#94A3B8', icon: 'tag' },
];
