import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Flame,
  Clock,
  Info,
  X,
  AlertTriangle,
  UtensilsCrossed,
} from 'lucide-react';
import { MenuItem, MenuCategory } from '@dineflow/database';
import { Badge, Modal } from '@dineflow/ui';

interface GuestMenuModuleProps {
  categories: MenuCategory[];
  items: MenuItem[];
  currencySymbol: string;
  onAddToCart?: (item: MenuItem) => void;
  getItemQuantity?: (itemId: string) => number;
}

export const GuestMenuModule: React.FC<GuestMenuModuleProps> = ({
  categories,
  items,
  currencySymbol,
  onAddToCart,
  getItemQuantity,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDietaryTag, setSelectedDietaryTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDish, setActiveDish] = useState<MenuItem | null>(null);

  // Collect unique dietary tags from all items
  const allDietaryTags = Array.from(
    new Set(items.flatMap((item) => item.dietary_tags || []))
  );

  const filteredItems = items.filter((item) => {
    const matchesCat =
      selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesDiet =
      selectedDietaryTag === 'all' ||
      (item.dietary_tags && item.dietary_tags.includes(selectedDietaryTag));
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesDiet && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search artisan dishes, ingredients, or pairings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-lg"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          All Items ({items.length})
        </button>
        {categories.map((c) => {
          const count = items.filter((i) => i.category_id === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {c.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Dietary Filter Pills */}
      {allDietaryTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none max-w-4xl mx-auto text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1">
            Dietary:
          </span>
          <button
            onClick={() => setSelectedDietaryTag('all')}
            className={`px-3 py-1 rounded-xl font-medium transition cursor-pointer ${
              selectedDietaryTag === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Any
          </button>
          {allDietaryTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedDietaryTag(tag)}
              className={`px-3 py-1 rounded-xl capitalize font-medium transition cursor-pointer ${
                selectedDietaryTag === tag
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Dishes Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveDish(item)}
            className={`bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition hover:border-slate-700 hover:shadow-2xl cursor-pointer flex flex-col justify-between group ${
              !item.is_available ? 'opacity-60' : ''
            }`}
          >
            <div>
              {/* Photo */}
              <div className="h-48 w-full bg-slate-950 relative overflow-hidden">
                <img
                  src={
                    item.image_url ||
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'
                  }
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {item.is_chef_special && (
                    <Badge variant="purple" size="sm">
                      <Sparkles className="w-3 h-3" /> Chef's Choice
                    </Badge>
                  )}
                  {item.is_featured && (
                    <Badge variant="warning" size="sm">
                      <Flame className="w-3 h-3" /> Popular
                    </Badge>
                  )}
                </div>

                {!item.is_available && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                    <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold uppercase tracking-wider">
                      Sold Out for Today
                    </span>
                  </div>
                )}
              </div>

              {/* Dish info */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-white text-base leading-tight group-hover:text-orange-400 transition">
                    {item.name}
                  </h3>
                  <span className="font-extrabold text-white text-base whitespace-nowrap">
                    {currencySymbol}
                    {Number(item.price).toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  {item.dietary_tags?.map((t) => (
                    <Badge key={t} variant="default" size="sm">
                      {t}
                    </Badge>
                  ))}
                  {item.preparation_time_minutes ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 pl-1">
                      <Clock className="w-3 h-3" /> {item.preparation_time_minutes} min
                    </span>
                  ) : null}
                  {item.calories ? (
                    <span className="text-[11px] text-slate-400 pl-1">
                      {item.calories} kcal
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span
                onClick={() => setActiveDish(item)}
                className="flex items-center gap-1 text-slate-400 hover:text-white font-medium cursor-pointer transition"
              >
                <Info className="w-3.5 h-3.5 text-orange-400" /> Details & Allergens
              </span>

              {onAddToCart && item.is_available !== false && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(item);
                  }}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>+ Add</span>
                  {getItemQuantity && getItemQuantity(item.id) > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white text-orange-600 text-[10px] flex items-center justify-center font-bold">
                      {getItemQuantity(item.id)}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl max-w-xl mx-auto">
          <UtensilsCrossed className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="font-bold text-white text-sm">No dishes match your selection</h4>
          <p className="text-xs text-slate-400 mt-1">
            Try clearing the search query or dietary filters.
          </p>
        </div>
      )}

      {/* Dish Detail Popup Modal (Strict Scope: NO cart / checkout) */}
      {activeDish && (
        <Modal
          isOpen={true}
          onClose={() => setActiveDish(null)}
          title={activeDish.name}
          description="Detailed dish profile & nutritional information"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="h-56 rounded-2xl overflow-hidden bg-slate-950">
              <img
                src={
                  activeDish.image_url ||
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'
                }
                alt={activeDish.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-white">
                {currencySymbol}
                {Number(activeDish.price).toFixed(2)}
              </span>
              <Badge variant={activeDish.is_available ? 'success' : 'danger'}>
                {activeDish.is_available ? 'Available' : 'Out of Stock'}
              </Badge>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeDish.description ||
                'Prepared fresh to order using sustainable ingredients and artisan culinary techniques.'}
            </p>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <p className="text-slate-500 font-medium">Nutritional Energy</p>
                <p className="text-white font-bold">{activeDish.calories || 450} kcal</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Estimated Kitchen Prep</p>
                <p className="text-white font-bold">
                  {activeDish.preparation_time_minutes || 15} minutes
                </p>
              </div>
            </div>

            {/* Allergens warning */}
            {activeDish.allergens && activeDish.allergens.length > 0 && (
              <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-2xl text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Allergen Notice:</p>
                  <p className="text-amber-200 mt-0.5">{activeDish.allergens.join(', ')}</p>
                </div>
              </div>
            )}

            {onAddToCart && activeDish.is_available !== false && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(activeDish);
                    setActiveDish(null);
                  }}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>
                    Add to Order Tray • {currencySymbol}
                    {Number(activeDish.price).toFixed(2)}
                  </span>
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
