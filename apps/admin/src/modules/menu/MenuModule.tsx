import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Sparkles,
  Flame,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { MenuItem, MenuCategory, HotelSubscription } from '@dineflow/database';
import { Button, Badge, StatCard } from '@dineflow/ui';
import { EntitlementService } from '@dineflow/core';
import { DishModal } from './DishModal';
import { CategoryManager } from './CategoryManager';

interface MenuModuleProps {
  hotelId: string;
  currencySymbol: string;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  subscription: HotelSubscription | null;
  onSaveDish: (dish: Partial<MenuItem>) => Promise<void>;
  onDeleteDish: (dishId: string) => Promise<void>;
  onToggleAvailability: (dish: MenuItem) => Promise<void>;
  onSaveCategory: (cat: { id?: string; name: string; description: string; sort_order: number }) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const MenuModule: React.FC<MenuModuleProps> = ({
  hotelId,
  currencySymbol,
  categories,
  menuItems,
  subscription,
  onSaveDish,
  onDeleteDish,
  onToggleAvailability,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);

  const quota = EntitlementService.checkFoodItemsQuota(menuItems.length, subscription);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategoryId === 'all' || item.category_id === selectedCategoryId;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.dietary_tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenNewDish = () => {
    if (!quota.allowed) {
      alert(quota.message);
      return;
    }
    setEditingDish(null);
    setIsDishModalOpen(true);
  };

  const handleOpenEditDish = (dish: MenuItem) => {
    setEditingDish(dish);
    setIsDishModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Category Manager Section */}
      <CategoryManager
        categories={categories}
        subscription={subscription}
        onSaveCategory={onSaveCategory}
        onDeleteCategory={onDeleteCategory}
      />

      {/* Quota Banner if near limit */}
      {!quota.allowed && (
        <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-800 text-amber-200 text-sm flex items-center justify-between">
          <span>{quota.message}</span>
          <Badge variant="warning">Capacity Reached</Badge>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map((c) => {
            const count = menuItems.filter((i) => i.category_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategoryId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  selectedCategoryId === c.id
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleOpenNewDish}
            disabled={!quota.allowed}
          >
            Add Dish
          </Button>
        </div>
      </div>

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between transition group hover:shadow-xl ${
              item.is_available ? 'border-slate-800' : 'border-slate-800/60 opacity-60'
            }`}
          >
            <div>
              <div className="relative h-44 bg-slate-950 overflow-hidden">
                <img
                  src={
                    item.image_url ||
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'
                  }
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  {item.is_chef_special && (
                    <Badge variant="purple" size="sm">
                      <Sparkles className="w-3 h-3" /> Chef
                    </Badge>
                  )}
                  {item.is_featured && (
                    <Badge variant="warning" size="sm">
                      <Flame className="w-3 h-3" /> Featured
                    </Badge>
                  )}
                </div>
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md text-white font-bold text-sm shadow">
                    {currencySymbol}
                    {Number(item.price).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-white text-base leading-tight">
                    {item.name}
                  </h4>
                  <button
                    onClick={() => onToggleAvailability(item)}
                    title={item.is_available ? 'Set Out of Stock' : 'Set In Stock'}
                    className={`p-1 rounded-lg transition ${
                      item.is_available
                        ? 'text-emerald-400 hover:bg-emerald-950/40'
                        : 'text-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    {item.is_available ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description || 'Artisan preparation using fresh ingredients.'}
                </p>

                {/* Dietary Tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {item.dietary_tags.map((tag) => (
                    <Badge key={tag} variant="default" size="sm">
                      {tag}
                    </Badge>
                  ))}
                  {item.preparation_time_minutes ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 pl-1">
                      <Clock className="w-3 h-3" /> {item.preparation_time_minutes}m
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {item.is_available ? (
                  <span className="text-emerald-400 font-medium">● In Stock</span>
                ) : (
                  <span className="text-rose-400 font-medium">○ Out of Stock</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditDish(item)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteDish(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
          <UtensilsCrossed className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h4 className="text-white font-medium">No dishes found</h4>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search or category filter.
          </p>
        </div>
      )}

      {/* Dish Modal */}
      <DishModal
        isOpen={isDishModalOpen}
        onClose={() => setIsDishModalOpen(false)}
        hotelId={hotelId}
        categories={categories}
        editingDish={editingDish}
        subscription={subscription}
        onSave={onSaveDish}
      />
    </div>
  );
};
