import React, { useState } from 'react';
import {
  Building2,
  Upload,
  Palette,
  Clock,
  Phone,
  Mail,
  MapPin,
  Save,
  Check,
} from 'lucide-react';
import { Hotel, HotelSubscription } from '@dineflow/database';
import { Button, Badge } from '@dineflow/ui';
import { CloudinaryService } from '@dineflow/core';

interface SettingsModuleProps {
  hotel: Hotel;
  subscription: HotelSubscription | null;
  onUpdateHotel: (updatedFields: Partial<Hotel>) => Promise<void>;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  hotel,
  subscription,
  onUpdateHotel,
}) => {
  const [formData, setFormData] = useState({
    name: hotel.name || '',
    tagline: hotel.tagline || '',
    description: hotel.description || '',
    theme_color: hotel.theme_color || '#ea580c',
    currency: hotel.currency || 'USD',
    currency_symbol: hotel.currency_symbol || '$',
    address: hotel.address || '',
    phone: hotel.phone || '',
    email: hotel.email || '',
    logo_url: hotel.logo_url || '',
    cover_image_url: hotel.cover_image_url || '',
    operating_hours: hotel.operating_hours || {
      monday: '08:00 - 22:00',
      tuesday: '08:00 - 22:00',
      wednesday: '08:00 - 22:00',
      thursday: '08:00 - 22:00',
      friday: '08:00 - 23:00',
      saturday: '09:00 - 23:30',
      sunday: '09:00 - 21:00',
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleUpload = async (file: File, type: 'logo' | 'cover') => {
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingCover(true);

    const res = await CloudinaryService.uploadImage({
      hotelId: hotel.id,
      file,
      assetType: type,
      subscription,
    });

    if (type === 'logo') setUploadingLogo(false);
    else setUploadingCover(false);

    if (res.success && res.asset) {
      if (type === 'logo') {
        setFormData((prev) => ({ ...prev, logo_url: res.asset!.secure_url }));
      } else {
        setFormData((prev) => ({ ...prev, cover_image_url: res.asset!.secure_url }));
      }
    } else {
      alert(res.error || 'Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdateHotel(formData);
    setIsSaving(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4" /> Hotel profile and settings saved successfully!
        </div>
      )}

      {/* Basic Profile */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-white text-base">Hotel Identity & Branding</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Hotel Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Tagline / Motto</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
              placeholder="e.g. Modern Mediterranean & Artisan Wines"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">About / Description</label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Media & Brand Colors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Brand Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.theme_color}
                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
              />
              <span className="font-mono text-xs text-white">{formData.theme_color}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Hotel Logo</label>
            <div className="flex items-center gap-3">
              {formData.logo_url && (
                <img
                  src={formData.logo_url}
                  alt="Logo"
                  className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                />
              )}
              <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer border border-slate-700 transition">
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')
                  }
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Cover Banner</label>
            <div className="flex items-center gap-3">
              {formData.cover_image_url && (
                <img
                  src={formData.cover_image_url}
                  alt="Cover"
                  className="w-16 h-10 rounded-xl object-cover border border-slate-700"
                />
              )}
              <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer border border-slate-700 transition">
                {uploadingCover ? 'Uploading...' : 'Upload Cover'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleUpload(e.target.files[0], 'cover')
                  }
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-400" />
          <h3 className="font-semibold text-white text-base">Weekly Operating Hours</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {days.map((day) => (
            <div key={day} className="space-y-1">
              <label className="text-xs font-medium text-slate-300 capitalize">{day}</label>
              <input
                type="text"
                value={formData.operating_hours[day] || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    operating_hours: {
                      ...formData.operating_hours,
                      [day]: e.target.value,
                    },
                  })
                }
                placeholder="08:00 - 22:00 or Closed"
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Contact Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-white text-base">Contact & Location</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Physical Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="lg" icon={Save} isLoading={isSaving}>
          Save Settings
        </Button>
      </div>
    </form>
  );
};
