import React, { useState, useEffect } from 'react';
import {
  Crown,
  Building2,
  Sliders,
  FileText,
  HardDrive,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import {
  Hotel,
  SubscriptionPlan,
  HotelSubscription,
  PlatformInvoice,
  MediaAsset,
  supabase,
} from '@dineflow/database';
import { Badge } from '@dineflow/ui';
import { HotelsModule } from './modules/hotels/HotelsModule';
import { PlansModule } from './modules/plans/PlansModule';
import { BillingModule } from './modules/billing/BillingModule';
import { StorageModule } from './modules/storage/StorageModule';

export interface SuperAdminAppProps {
  onSwitchToHotelAdmin?: (slug: string) => void;
  onNavigateToLanding?: () => void;
}

export type SuperAdminTab = 'hotels' | 'plans' | 'billing' | 'storage';

export const SuperAdminApp: React.FC<SuperAdminAppProps> = ({
  onSwitchToHotelAdmin,
  onNavigateToLanding,
}) => {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('hotels');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<HotelSubscription[]>([]);
  const [invoices, setInvoices] = useState<PlatformInvoice[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hotelsRes, plansRes, subsRes, invRes, assetRes] = await Promise.all([
        supabase.from('hotels').select('*').order('created_at', { ascending: false }),
        supabase.from('subscription_plans').select('*').order('sort_order'),
        supabase
          .from('hotel_subscriptions')
          .select('*, plan:subscription_plans(*)')
          .order('created_at', { ascending: false }),
        supabase
          .from('platform_invoices')
          .select('*, hotel:hotels(*)')
          .order('created_at', { ascending: false }),
        supabase
          .from('media_assets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      setHotels(hotelsRes.data || []);
      setPlans(plansRes.data || []);
      setSubscriptions(subsRes.data || []);
      setInvoices(invRes.data || []);
      setAssets(assetRes.data || []);
    } catch (err) {
      console.error('Error loading SuperAdmin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for Hotels module
  const handleCreateHotel = async (data: {
    name: string;
    slug: string;
    plan_id: string;
    currency: string;
    currency_symbol: string;
    tagline: string;
  }) => {
    const hotelId = crypto.randomUUID();
    const { error: hotelErr } = await supabase.from('hotels').insert({
      id: hotelId,
      name: data.name,
      slug: data.slug,
      status: 'active',
      currency: data.currency,
      currency_symbol: data.currency_symbol,
      tagline: data.tagline,
      theme_color: '#ea580c',
    });
    if (hotelErr) throw hotelErr;

    // Create default subscription
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);

    await supabase.from('hotel_subscriptions').insert({
      hotel_id: hotelId,
      plan_id: data.plan_id,
      billing_cycle: 'monthly',
      status: 'active',
      start_date: new Date().toISOString(),
      expiry_date: expiry.toISOString(),
      assigned_by: 'super_admin',
    });

    // Create default Cash Account
    await supabase.from('hotel_financial_accounts').insert({
      hotel_id: hotelId,
      account_name: 'Main Drawer Cash',
      account_type: 'cash',
      opening_balance: 0,
      current_balance: 0,
      currency: data.currency,
      is_active: true,
    });

    await loadData();
  };

  const handleToggleHotelStatus = async (hotel: Hotel) => {
    const nextStatus = hotel.status === 'active' ? 'suspended' : 'active';
    await supabase.from('hotels').update({ status: nextStatus }).eq('id', hotel.id);
    setHotels((prev) =>
      prev.map((h) => (h.id === hotel.id ? { ...h, status: nextStatus } : h))
    );
  };

  const handleAssignPlan = async (hotelId: string, planId: string) => {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);

    // Look for active sub
    const existing = subscriptions.find((s) => s.hotel_id === hotelId);
    if (existing) {
      await supabase
        .from('hotel_subscriptions')
        .update({ plan_id: planId, expiry_date: expiry.toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('hotel_subscriptions').insert({
        hotel_id: hotelId,
        plan_id: planId,
        billing_cycle: 'monthly',
        status: 'active',
        start_date: new Date().toISOString(),
        expiry_date: expiry.toISOString(),
      });
    }
    await loadData();
  };

  // Handlers for Plans module
  const handleUpdatePlan = async (updatedPlan: SubscriptionPlan) => {
    const { error } = await supabase
      .from('subscription_plans')
      .update(updatedPlan)
      .eq('id', updatedPlan.id);
    if (error) throw error;
    setPlans((prev) => prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
  };

  // Handlers for Billing module
  const handleRecordPayment = async (paymentData: {
    invoice_id: string;
    hotel_id: string;
    amount: number;
    payment_method: 'bank_transfer' | 'wire' | 'credit_card_manual' | 'cash' | 'cheque' | 'other';
    reference_number?: string;
    notes?: string;
  }) => {
    const { error: payErr } = await supabase.from('platform_payments').insert({
      ...paymentData,
      recorded_by: 'super_admin',
    });
    if (payErr) throw payErr;

    // Update invoice paid_amount
    const invoice = invoices.find((i) => i.id === paymentData.invoice_id);
    if (invoice) {
      const newPaid = Number(invoice.paid_amount || 0) + Number(paymentData.amount);
      const isFull = newPaid >= Number(invoice.total_amount);

      await supabase
        .from('platform_invoices')
        .update({
          paid_amount: newPaid,
          status: isFull ? 'paid' : 'partially_paid',
        })
        .eq('id', invoice.id);
    }
    await loadData();
  };

  const tabs: { id: SuperAdminTab; label: string; icon: any; count?: number }[] = [
    { id: 'hotels', label: 'Hotel Tenants', icon: Building2, count: hotels.length },
    { id: 'plans', label: 'Subscription Plans & Limits', icon: Sliders, count: plans.length },
    { id: 'billing', label: 'Platform Billing & Invoices', icon: FileText, count: invoices.length },
    { id: 'storage', label: 'Cloudinary CDN Storage', icon: HardDrive, count: assets.length },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  DineFlow Platform Owner
                </h1>
                <Badge variant="purple" size="sm">
                  Super Admin
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Multi-Tenant SaaS Infrastructure & Tenant Quota Controller
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToLanding && (
              <button
                onClick={onNavigateToLanding}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700 transition"
              >
                Marketing Landing
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                {tab.label}
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading Super Admin data...
          </div>
        ) : (
          <>
            {activeTab === 'hotels' && (
              <HotelsModule
                hotels={hotels}
                plans={plans}
                subscriptions={subscriptions}
                onCreateHotel={handleCreateHotel}
                onToggleStatus={handleToggleHotelStatus}
                onAssignPlan={handleAssignPlan}
                onSwitchToHotelAdmin={onSwitchToHotelAdmin}
              />
            )}

            {activeTab === 'plans' && (
              <PlansModule plans={plans} onUpdatePlan={handleUpdatePlan} />
            )}

            {activeTab === 'billing' && (
              <BillingModule
                invoices={invoices}
                hotels={hotels}
                onRecordPayment={handleRecordPayment}
              />
            )}

            {activeTab === 'storage' && (
              <StorageModule assets={assets} hotels={hotels} />
            )}
          </>
        )}
      </main>
    </div>
  );
};
