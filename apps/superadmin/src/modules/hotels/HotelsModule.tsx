import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Shield,
  Ban,
  CheckCircle,
  Eye,
  Sliders,
} from 'lucide-react';
import { Hotel, SubscriptionPlan, HotelSubscription } from '@dineflow/database';
import { Button, Badge, Modal } from '@dineflow/ui';
import { buildHotelGuestUrl } from '@dineflow/core';

interface HotelsModuleProps {
  hotels: Hotel[];
  plans: SubscriptionPlan[];
  subscriptions: HotelSubscription[];
  onCreateHotel: (hotelData: {
    name: string;
    slug: string;
    plan_id: string;
    currency: string;
    currency_symbol: string;
    tagline: string;
  }) => Promise<void>;
  onToggleStatus: (hotel: Hotel) => Promise<void>;
  onAssignPlan: (hotelId: string, planId: string) => Promise<void>;
  onSwitchToHotelAdmin?: (slug: string) => void;
}

export const HotelsModule: React.FC<HotelsModuleProps> = ({
  hotels,
  plans,
  subscriptions,
  onCreateHotel,
  onToggleStatus,
  onAssignPlan,
  onSwitchToHotelAdmin,
}) => {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedHotelForPlan, setSelectedHotelForPlan] = useState<Hotel | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  // Form state
  const [newHotel, setNewHotel] = useState({
    name: '',
    slug: '',
    plan_id: plans[0]?.id || '',
    currency: 'USD',
    currency_symbol: '$',
    tagline: 'Artisan Dining & Spirits',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredHotels = hotels.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    setNewHotel((prev) => ({ ...prev, name, slug }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotel.name.trim() || !newHotel.slug.trim()) {
      setError('Hotel name and slug are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateHotel({
        ...newHotel,
        plan_id: newHotel.plan_id || plans[0]?.id,
      });
      setIsSubmitting(false);
      setIsCreateOpen(false);
      setNewHotel({
        name: '',
        slug: '',
        plan_id: plans[0]?.id || '',
        currency: 'USD',
        currency_symbol: '$',
        tagline: 'Artisan Dining & Spirits',
      });
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Error creating hotel');
    }
  };

  const handleOpenAssignPlan = (hotel: Hotel) => {
    setSelectedHotelForPlan(hotel);
    const sub = subscriptions.find((s) => s.hotel_id === hotel.id);
    setSelectedPlanId(sub?.plan_id || plans[0]?.id || '');
    setIsPlanModalOpen(true);
  };

  const handleConfirmAssignPlan = async () => {
    if (!selectedHotelForPlan || !selectedPlanId) return;
    try {
      setIsSubmitting(true);
      await onAssignPlan(selectedHotelForPlan.id, selectedPlanId);
      setIsSubmitting(false);
      setIsPlanModalOpen(false);
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || 'Failed to update plan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hotels by name or subdomain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => {
            setError(null);
            setIsCreateOpen(true);
          }}
        >
          Provision New Hotel
        </Button>
      </div>

      {/* Hotels Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold uppercase">Hotel / Enterprise</th>
                <th className="py-3.5 px-4 font-semibold uppercase">Subdomain / Tenant</th>
                <th className="py-3.5 px-4 font-semibold uppercase">Subscription Plan</th>
                <th className="py-3.5 px-4 font-semibold uppercase">Status</th>
                <th className="py-3.5 px-4 font-semibold uppercase">Onboarded</th>
                <th className="py-3.5 px-4 font-semibold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredHotels.map((hotel) => {
                const sub = subscriptions.find((s) => s.hotel_id === hotel.id);
                const guestUrl = buildHotelGuestUrl(hotel.slug);

                return (
                  <tr key={hotel.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {hotel.logo_url ? (
                          <img
                            src={hotel.logo_url}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
                            {hotel.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">{hotel.name}</p>
                          <p className="text-[11px] text-slate-400">{hotel.tagline || 'Artisan SaaS'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-orange-400">
                      <div className="flex items-center gap-1.5">
                        <span>{hotel.slug}.localhost:5173</span>
                        <a
                          href={guestUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-white"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleOpenAssignPlan(hotel)}
                        className="inline-flex items-center gap-1 text-slate-300 hover:text-white group"
                      >
                        <Badge variant="purple" size="sm">
                          {sub?.plan?.name || 'Base Starter'}
                        </Badge>
                        <Sliders className="w-3 h-3 text-slate-500 group-hover:text-white" />
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={hotel.status === 'active' ? 'success' : 'danger'} size="sm">
                        {hotel.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(hotel.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onSwitchToHotelAdmin && (
                          <button
                            onClick={() => onSwitchToHotelAdmin(hotel.slug)}
                            className="px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                            title="Manage as Hotel Admin"
                          >
                            Admin Console
                          </button>
                        )}
                        <button
                          onClick={() => onToggleStatus(hotel)}
                          className={`px-2 py-1 text-xs rounded transition ${
                            hotel.status === 'active'
                              ? 'text-rose-400 hover:bg-rose-950/40'
                              : 'text-emerald-400 hover:bg-emerald-950/40'
                          }`}
                        >
                          {hotel.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Hotel Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision Hotel SaaS Account"
        description="Creates isolated tenant partition, sets initial subscription, and assigns subdomain."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Hotel Name *</label>
              <input
                type="text"
                required
                value={newHotel.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Bella Roma Ristorante"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Subdomain Slug *</label>
              <input
                type="text"
                required
                value={newHotel.slug}
                onChange={(e) =>
                  setNewHotel({
                    ...newHotel,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  })
                }
                placeholder="e.g. bellaroma"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Subscription Plan *</label>
              <select
                value={newHotel.plan_id}
                onChange={(e) => setNewHotel({ ...newHotel, plan_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${p.monthly_price}/mo
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Currency Symbol</label>
              <input
                type="text"
                value={newHotel.currency_symbol}
                onChange={(e) => setNewHotel({ ...newHotel, currency_symbol: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Tagline</label>
            <input
              type="text"
              value={newHotel.tagline}
              onChange={(e) => setNewHotel({ ...newHotel, tagline: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reassign Plan Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={`Change Subscription: ${selectedHotelForPlan?.name}`}
        description="Select new plan limits to apply dynamically to this hotel."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Select Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.monthly_price}/mo) — {p.max_food_items} dishes, {p.max_staff_accounts} staff
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmAssignPlan} isLoading={isSubmitting}>
              Update Plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
