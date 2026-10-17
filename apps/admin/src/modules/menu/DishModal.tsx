import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, X } from 'lucide-react';
import { MenuItem, MenuCategory, HotelSubscription } from '@dineflow/database';
import { Modal, Button } from '@dineflow/ui';
import { CloudinaryService } from '@dineflow/core';

interface DishModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  categories: MenuCategory[];
  editingDish: MenuItem | null;
  subscription: HotelSubscription | null;
  onSave: (dishData: Partial<MenuItem>) => Promise<void>;
}

export const DishModal: React.FC<DishModalProps> = ({
  isOpen,
  onClose,
  hotelId,
  categories,
  editingDish,
  subscription,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    price: 0,
    compare_at_price: 0,
    calories: 0,
    preparation_time_minutes: 15,
    spicy_level: 0,
    dietary_tags: [] as string[],
    allergens: [] as string[],
    image_url: '',
    is_available: true,
    is_featured: false,
    is_chef_special: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [allergenInput, setAllergenInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingDish) {
      setFormData({
        name: editingDish.name || '',
        category_id: editingDish.category_id || (categories[0]?.id || ''),
        description: editingDish.description || '',
        price: editingDish.price || 0,
        compare_at_price: editingDish.compare_at_price || 0,
        calories: editingDish.calories || 0,
        preparation_time_minutes: editingDish.preparation_time_minutes || 15,
        spicy_level: editingDish.spicy_level || 0,
        dietary_tags: editingDish.dietary_tags || [],
        allergens: editingDish.allergens || [],
        image_url: editingDish.image_url || '',
        is_available: editingDish.is_available ?? true,
        is_featured: editingDish.is_featured ?? false,
        is_chef_special: editingDish.is_chef_special ?? false,
      });
    } else {
      setFormData({
        name: '',
        category_id: categories[0]?.id || '',
        description: '',
        price: 12.0,
        compare_at_price: 0,
        calories: 350,
        preparation_time_minutes: 15,
        spicy_level: 0,
        dietary_tags: ['vegetarian'],
        allergens: [],
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
        is_available: true,
        is_featured: false,
        is_chef_special: false,
      });
    }
    setErrorMessage(null);
  }, [editingDish, categories, isOpen]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMessage(null);

    const res = await CloudinaryService.uploadImage({
      hotelId,
      file,
      assetType: 'menu_item',
      subscription,
    });

    setUploadingImage(false);
    if (res.success && res.asset) {
      setFormData((prev) => ({ ...prev, image_url: res.asset!.secure_url }));
    } else {
      setErrorMessage(res.error || 'Failed to upload image');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.dietary_tags.includes(tagInput.trim().toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        dietary_tags: [...prev.dietary_tags, tagInput.trim().toLowerCase()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      dietary_tags: prev.dietary_tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Dish name is required');
      return;
    }
    if (!formData.category_id) {
      setErrorMessage('Please select a category');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(formData);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err.message || 'Error saving dish');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingDish ? 'Edit Culinary Creation' : 'Add New Menu Item'}
      description="Update dish pricing, high-res presentation photo, dietary tags, and availability."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Dish Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              placeholder="e.g. Truffle Infused Tagliolini"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Category *</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Description</label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            placeholder="Artisan description detailing flavor profile, farm-fresh ingredients, and culinary craft..."
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Price ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Compare Price</label>
            <input
              type="number"
              step="0.01"
              value={formData.compare_at_price}
              onChange={(e) =>
                setFormData({ ...formData, compare_at_price: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Calories (kcal)</label>
            <input
              type="number"
              value={formData.calories}
              onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Prep Time (min)</label>
            <input
              type="number"
              value={formData.preparation_time_minutes}
              onChange={(e) =>
                setFormData({ ...formData, preparation_time_minutes: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Image Upload & Preview */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300">Presentation Photo</label>
          <div className="flex items-center gap-4">
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt="Preview"
                className="w-20 h-20 rounded-xl object-cover border border-slate-700"
              />
            )}
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                placeholder="https://images.unsplash.com/... or upload below"
              />
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer border border-slate-700 transition">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingImage ? 'Uploading to Cloudinary...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-400">JPG, PNG, WebP up to 10MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dietary tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Dietary Badges</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="e.g. vegan, gluten-free, keto, halaal"
              className="flex-1 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleAddTag}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {formData.dietary_tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-950/60 border border-orange-800/50 text-orange-400 text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Status flags */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-0"
            />
            In Stock
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-0"
            />
            Featured Dish
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_chef_special}
              onChange={(e) => setFormData({ ...formData, is_chef_special: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-0"
            />
            Chef's Special
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            {editingDish ? 'Save Changes' : 'Create Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
