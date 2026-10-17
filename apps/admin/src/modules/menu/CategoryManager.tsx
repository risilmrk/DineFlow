import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import { MenuCategory, HotelSubscription } from '@dineflow/database';
import { Modal, Button, Badge } from '@dineflow/ui';
import { EntitlementService } from '@dineflow/core';

interface CategoryManagerProps {
  categories: MenuCategory[];
  subscription: HotelSubscription | null;
  onSaveCategory: (cat: { id?: string; name: string; description: string; sort_order: number }) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  subscription,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quota = EntitlementService.checkCategoryQuota(categories.length, subscription);

  const handleOpenNew = () => {
    if (!quota.allowed) {
      alert(quota.message);
      return;
    }
    setEditingCat(null);
    setName('');
    setDescription('');
    setSortOrder(categories.length + 1);
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: MenuCategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setSortOrder(cat.sort_order);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveCategory({
        id: editingCat?.id,
        name: name.trim(),
        description: description.trim(),
        sort_order: sortOrder,
      });
      setIsSaving(false);
      setModalOpen(false);
    } catch (err: any) {
      setIsSaving(false);
      setError(err.message || 'Error saving category');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-orange-400" />
          <h3 className="font-semibold text-white">Menu Categories</h3>
          <Badge variant="outline" size="sm">
            {categories.length} / {quota.maxLimit}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={Plus}
          onClick={handleOpenNew}
          disabled={!quota.allowed}
        >
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60"
          >
            <div>
              <p className="font-medium text-white text-sm">{c.name}</p>
              <p className="text-xs text-slate-400 truncate max-w-[160px]">
                {c.description || 'No description'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEdit(c)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteCategory(c.id)}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCat ? 'Edit Category' : 'Create Category'}
        description="Organize your digital menu into intuitive sections (Appetizers, Mains, Wine, etc.)."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-950 border border-rose-800 text-rose-300 rounded-lg text-xs">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              placeholder="e.g. Handmade Pasta"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              placeholder="Freshly rolled every morning with semolina..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
