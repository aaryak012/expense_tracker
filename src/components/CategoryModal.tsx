import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Category, CategoryFormData } from '../types';

interface CategoryModalProps {
  category?: Category | null;
  onSave: (data: CategoryFormData) => Promise<void>;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#3B82F6', '#06B6D4', '#EC4899', '#64748B', '#94A3B8',
];

const ICONS = [
  'utensils', 'car', 'shopping-bag', 'film', 'heart',
  'home', 'book', 'plane', 'zap', 'tag', 'coffee', 'music',
  'gamepad', 'gift', 'briefcase', 'smartphone', 'globe', 'star',
];

const emptyForm: CategoryFormData = {
  name: '',
  color: '#3B82F6',
  icon: 'tag',
  budget: '',
};

export default function CategoryModal({ category, onSave, onClose }: CategoryModalProps) {
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        color: category.color,
        icon: category.icon,
        budget: String(category.budget || ''),
      });
    } else {
      setForm(emptyForm);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof CategoryFormData, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0D1526 0%, #080C18 100%)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.8)',
        }}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <h2 className="text-lg font-semibold text-white">
            {category ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preview */}
          <div className="flex items-center justify-center mb-2">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
              style={{ background: `${form.color}20`, border: `2px solid ${form.color}40` }}
            >
              <span style={{ color: form.color }}>◆</span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Food & Dining"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm transition-all"
            />
          </div>

          {/* Monthly Budget */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Monthly Budget (optional)</label>
            <input
              type="number"
              value={form.budget}
              onChange={(e) => set('budget', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm transition-all"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block font-medium">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => set('color', color)}
                  className={`w-8 h-8 rounded-lg transition-all duration-200 ${
                    form.color === color ? 'scale-125 ring-2 ring-white/40' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                title="Custom color"
              />
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block font-medium">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => set('icon', icon)}
                  className={`p-2.5 rounded-lg text-xs text-center transition-all duration-200 ${
                    form.icon === icon
                      ? 'border-2 text-white'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                  style={form.icon === icon ? { borderColor: form.color, background: `${form.color}20`, color: form.color } : {}}
                  title={icon}
                >
                  {icon.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
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
              className="flex-1 px-4 py-3 rounded-xl text-white font-semibold transition-all text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}CC)` }}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                category ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
