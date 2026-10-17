import React, { useState, useEffect } from 'react';
import {
  Building2,
  Globe,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Palette,
  DollarSign,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { Modal, Button, Badge } from '@dineflow/ui';
import { SubscriptionPlan, Hotel, supabase } from '@dineflow/database';

interface CreateHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  onHotelCreated: (hotel: { id: string; name: string; slug: string }) => void;
}

const POPULAR_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
];

export const CreateHotelModal: React.FC<CreateHotelModalProps> = ({
  isOpen,
  onClose,
  plans,
  onHotelCreated,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [themeColor, setThemeColor] = useState('#ea580c');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    setSlug(generated);
  };

  const handleCurrencyChange = (code: string) => {
    const item = POPULAR_CURRENCIES.find((c) => c.code === code);
    setCurrency(code);
    if (item) setCurrencySymbol(item.symbol);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Hotel or restaurant name is required.');
      return;
    }
    if (!slug.trim()) {
      setErrorMessage('Subdomain slug is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Call the atomic stored function deployed on database
      const { data, error } = await supabase.rpc('create_hotel_with_owner', {
        p_name: name.trim(),
        p_slug: slug.trim().toLowerCase(),
        p_plan_id: selectedPlanId || null,
        p_currency: currency,
        p_currency_symbol: currencySymbol,
        p_tagline: tagline.trim() || 'Artisan Dining & Gastronomy',
        p_theme_color: themeColor,
      });

      if (error) {
        throw error;
      }

      setIsSubmitting(false);
      onClose();
      // Notify parent to navigate into new hotel admin console
      if (data && onHotelCreated) {
        onHotelCreated(data);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Error creating hotel account.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Your Hotel Digital Menu"
      description="Launch your digital menu with a dedicated subdomain, table QR codes, and accounting."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Name and Subdomain */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Hotel or Restaurant Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Trattoria Bella Vista"
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500 shadow-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Subdomain Slug *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                placeholder="e.g. bellavista"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-orange-400 font-mono text-xs focus:outline-none focus:border-orange-500 shadow-sm"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Live Preview: <span className="font-mono text-slate-300">http://{slug || 'yourname'}.localhost:5173</span>
            </p>
          </div>
        </div>

        {/* Tagline */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Tagline / Cuisine Specialty</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. Wood-Fired Neapolitan Pizza & Natural Wines"
            className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500 shadow-sm"
          />
        </div>

        {/* Currency & Brand Color */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Menu Currency</label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500 shadow-sm"
            >
              {POPULAR_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Brand Color Accent</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
              />
              <span className="font-mono text-xs text-white uppercase">{themeColor}</span>
              <span className="text-[11px] text-slate-400">Used for QR codes & menu highlights</span>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        {plans.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300">
              Select Starting Subscription Plan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                    selectedPlanId === p.id
                      ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10'
                      : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{p.name}</span>
                      {p.is_featured && <Badge variant="warning" size="sm">Popular</Badge>}
                    </div>
                    <p className="text-base font-extrabold text-white mt-1">
                      ${p.monthly_price}
                      <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Up to {p.max_food_items} dishes • {p.max_staff_accounts} staff
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={ArrowRight}
            isLoading={isSubmitting}
          >
            Launch Digital Menu
          </Button>
        </div>
      </form>
    </Modal>
  );
};
