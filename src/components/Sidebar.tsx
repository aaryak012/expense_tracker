import {
  LayoutDashboard, Receipt, Tag, BarChart3, Settings, LogOut,
  TrendingUp, ChevronRight,
} from 'lucide-react';
import { View } from '../types';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  userName: string;
}

const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'expenses', label: 'Expenses', icon: <Receipt className="w-5 h-5" /> },
  { id: 'categories', label: 'Categories', icon: <Tag className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export default function Sidebar({ activeView, onViewChange, userName }: SidebarProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside
      className="w-64 h-screen flex flex-col border-r border-white/8 flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, #080C18 0%, #060912 100%)',
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-none">ExpenseOS</div>
            <div className="text-slate-500 text-xs mt-0.5">v2.0</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 text-blue-400" />}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/8">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{userName}</div>
            <div className="text-slate-500 text-xs">Free Plan</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
