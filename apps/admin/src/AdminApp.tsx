import React, { useState, useEffect } from 'react';
import {
  Building2,
  UtensilsCrossed,
  Coins,
  QrCode,
  Users,
  Key,
  Settings,
  ExternalLink,
  ChevronDown,
  LayoutGrid,
  ChefHat,
  BellRing,
} from 'lucide-react';
import {
  Hotel,
  MenuCategory,
  MenuItem,
  HotelSubscription,
  HotelMembership,
  StaffInvitation,
  FinancialAccount,
  AccountingCategory,
  FinancialTransaction,
  ApiKey,
  HotelRole,
  HotelTable,
  Order,
  WaiterCall,
  supabase,
} from '@dineflow/database';
import { buildHotelGuestUrl } from '@dineflow/core';
import { Badge } from '@dineflow/ui';
import { MenuModule } from './modules/menu/MenuModule';
import { AccountingModule } from './modules/accounting/AccountingModule';
import { StaffModule } from './modules/staff/StaffModule';
import { QRCodeModule } from './modules/qrcode/QRCodeModule';
import { ApiModule } from './modules/api/ApiModule';
import { SettingsModule } from './modules/settings/SettingsModule';
import { TablesModule } from './modules/tables/TablesModule';
import { OrdersModule } from './modules/orders/OrdersModule';

export interface AdminAppProps {
  initialHotelSlug?: string;
  onNavigateToGuest?: (slug: string) => void;
  onNavigateToSuperAdmin?: () => void;
  onNavigateToLanding?: () => void;
}

export type AdminModuleTab = 'orders' | 'tables' | 'menu' | 'accounting' | 'staff' | 'qrcode' | 'api' | 'settings';

export const AdminApp: React.FC<AdminAppProps> = ({
  initialHotelSlug = 'gusto',
  onNavigateToGuest,
  onNavigateToSuperAdmin,
  onNavigateToLanding,
}) => {
  const [activeHotelSlug, setActiveHotelSlug] = useState<string>(initialHotelSlug);
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [subscription, setSubscription] = useState<HotelSubscription | null>(null);
  const [activeTab, setActiveTab] = useState<AdminModuleTab>('menu');

  // Keep activeHotelSlug in sync when initialHotelSlug prop changes
  useEffect(() => {
    if (initialHotelSlug) {
      setActiveHotelSlug(initialHotelSlug);
    }
  }, [initialHotelSlug]);

  // Domain data
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [accountingCategories, setAccountingCategories] = useState<AccountingCategory[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [memberships, setMemberships] = useState<HotelMembership[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [roles, setRoles] = useState<HotelRole[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [tables, setTables] = useState<HotelTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all hotels list for top tenant switcher
  useEffect(() => {
    async function loadHotels() {
      const { data } = await supabase.from('hotels').select('*').order('name');
      if (data && data.length > 0) {
        setAllHotels(data);
      }
    }
    loadHotels();
  }, []);

  // Fetch specific hotel context data whenever activeHotelSlug changes
  useEffect(() => {
    async function fetchHotelData() {
      setLoading(true);
      try {
        const { data: hotelData } = await supabase
          .from('hotels')
          .select('*')
          .eq('slug', activeHotelSlug)
          .maybeSingle();

        if (hotelData) {
          setHotel(hotelData);

          // Fetch subscription with plan
          const { data: subData } = await supabase
            .from('hotel_subscriptions')
            .select('*, plan:subscription_plans(*)')
            .eq('hotel_id', hotelData.id)
            .eq('status', 'active')
            .maybeSingle();
          setSubscription(subData);

          // Parallel load of modules data
          const [
            catRes,
            itemRes,
            accRes,
            accCatRes,
            txRes,
            memRes,
            invRes,
            rolesRes,
            keyRes,
            tablesRes,
            ordersRes,
            callsRes,
          ] = await Promise.all([
            supabase
              .from('menu_categories')
              .select('*')
              .eq('hotel_id', hotelData.id)
              .order('sort_order'),
            supabase
              .from('menu_items')
              .select('*, category:menu_categories(*)')
              .eq('hotel_id', hotelData.id)
              .order('sort_order'),
            supabase
              .from('hotel_financial_accounts')
              .select('*')
              .eq('hotel_id', hotelData.id),
            supabase
              .from('hotel_accounting_categories')
              .select('*')
              .eq('hotel_id', hotelData.id),
            supabase
              .from('hotel_financial_transactions')
              .select('*, account:hotel_financial_accounts(*), category:hotel_accounting_categories(*)')
              .eq('hotel_id', hotelData.id)
              .order('transaction_date', { ascending: false }),
            supabase
              .from('hotel_memberships')
              .select('*, profile:profiles(*), role:hotel_roles(*)')
              .eq('hotel_id', hotelData.id),
            supabase
              .from('staff_invitations')
              .select('*, role:hotel_roles(*)')
              .eq('hotel_id', hotelData.id),
            supabase
              .from('hotel_roles')
              .select('*')
              .or(`hotel_id.eq.${hotelData.id},hotel_id.is.null`),
            supabase
              .from('api_keys')
              .select('*')
              .eq('hotel_id', hotelData.id)
              .order('created_at', { ascending: false }),
            supabase
              .from('hotel_tables')
              .select('*')
              .eq('hotel_id', hotelData.id)
              .order('table_number'),
            supabase
              .from('orders')
              .select('*, items:order_items(*)')
              .eq('hotel_id', hotelData.id)
              .order('created_at', { ascending: false }),
            supabase
              .from('waiter_calls')
              .select('*')
              .eq('hotel_id', hotelData.id)
              .order('created_at', { ascending: false }),
          ]);

          setCategories(catRes.data || []);
          setMenuItems(itemRes.data || []);
          setAccounts(accRes.data || []);
          setAccountingCategories(accCatRes.data || []);
          setTransactions(txRes.data || []);
          setMemberships(memRes.data || []);
          setInvitations(invRes.data || []);
          setRoles(rolesRes.data || []);
          setApiKeys(keyRes.data || []);
          setTables(tablesRes.data || []);
          setOrders(ordersRes.data || []);
          setWaiterCalls(callsRes.data || []);
        }
      } catch (err) {
        console.error('Error loading hotel admin data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHotelData();
  }, [activeHotelSlug]);

  // Handlers for Menu module
  const handleSaveDish = async (dishData: Partial<MenuItem>) => {
    if (!hotel) return;
    if (dishData.id) {
      await supabase.from('menu_items').update(dishData).eq('id', dishData.id);
    } else {
      const slug = (dishData.name || 'item').toLowerCase().replace(/[^a-z0-9]/g, '-');
      await supabase.from('menu_items').insert({
        ...dishData,
        hotel_id: hotel.id,
        slug,
      });
    }
    // Refresh items
    const { data } = await supabase
      .from('menu_items')
      .select('*, category:menu_categories(*)')
      .eq('hotel_id', hotel.id)
      .order('sort_order');
    if (data) setMenuItems(data);
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!confirm('Are you sure you want to remove this dish?')) return;
    await supabase.from('menu_items').delete().eq('id', dishId);
    setMenuItems((prev) => prev.filter((i) => i.id !== dishId));
  };

  const handleToggleDishAvailability = async (dish: MenuItem) => {
    const next = !dish.is_available;
    await supabase.from('menu_items').update({ is_available: next }).eq('id', dish.id);
    setMenuItems((prev) =>
      prev.map((i) => (i.id === dish.id ? { ...i, is_available: next } : i))
    );
  };

  const handleSaveCategory = async (cat: {
    id?: string;
    name: string;
    description: string;
    sort_order: number;
  }) => {
    if (!hotel) return;
    if (cat.id) {
      await supabase
        .from('menu_categories')
        .update({ name: cat.name, description: cat.description, sort_order: cat.sort_order })
        .eq('id', cat.id);
    } else {
      const slug = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await supabase.from('menu_categories').insert({
        hotel_id: hotel.id,
        name: cat.name,
        description: cat.description,
        slug,
        sort_order: cat.sort_order,
      });
    }
    const { data } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('sort_order');
    if (data) setCategories(data);
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Delete this category? Items within will need a new category.')) return;
    await supabase.from('menu_categories').delete().eq('id', catId);
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  // Handlers for Accounting module
  const handleAddTransaction = async (txData: Partial<FinancialTransaction>) => {
    if (!hotel) return;
    await supabase.from('hotel_financial_transactions').insert({
      ...txData,
      hotel_id: hotel.id,
    });
    // Refresh ledger
    const { data } = await supabase
      .from('hotel_financial_transactions')
      .select('*, account:hotel_financial_accounts(*), category:hotel_accounting_categories(*)')
      .eq('hotel_id', hotel.id)
      .order('transaction_date', { ascending: false });
    if (data) setTransactions(data);

    // Refresh accounts balances
    const { data: accData } = await supabase
      .from('hotel_financial_accounts')
      .select('*')
      .eq('hotel_id', hotel.id);
    if (accData) setAccounts(accData);
  };

  const handleVoidTransaction = async (txId: string, reason: string) => {
    await supabase
      .from('hotel_financial_transactions')
      .update({
        is_voided: true,
        void_reason: reason,
        voided_at: new Date().toISOString(),
      })
      .eq('id', txId);

    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, is_voided: true, void_reason: reason } : t))
    );
  };

  // Handlers for Staff module
  const handleSendInvitation = async (email: string, roleId: string) => {
    if (!hotel) return;
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase.from('staff_invitations').insert({
      hotel_id: hotel.id,
      email,
      role_id: roleId,
      invited_by: hotel.id,
      token,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    });

    const { data } = await supabase
      .from('staff_invitations')
      .select('*, role:hotel_roles(*)')
      .eq('hotel_id', hotel.id);
    if (data) setInvitations(data);
  };

  const handleRevokeInvitation = async (invId: string) => {
    await supabase.from('staff_invitations').update({ status: 'revoked' }).eq('id', invId);
    setInvitations((prev) =>
      prev.map((i) => (i.id === invId ? { ...i, status: 'revoked' } : i))
    );
  };

  const handleRemoveMembership = async (memId: string) => {
    if (!confirm('Remove this staff user from your hotel team?')) return;
    await supabase.from('hotel_memberships').delete().eq('id', memId);
    setMemberships((prev) => prev.filter((m) => m.id !== memId));
  };

  // Handlers for API module
  const handleCreateApiKey = async (name: string): Promise<string> => {
    if (!hotel) return '';
    const secret = `df_live_${crypto.randomUUID().replace(/-/g, '')}`;
    const prefix = secret.slice(0, 12);

    await supabase.from('api_keys').insert({
      hotel_id: hotel.id,
      name,
      key_prefix: prefix,
      key_hash: secret,
      is_active: true,
    });

    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false });
    if (data) setApiKeys(data);

    return secret;
  };

  const handleRevokeApiKey = async (keyId: string) => {
    await supabase.from('api_keys').update({ is_active: false }).eq('id', keyId);
    setApiKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, is_active: false } : k))
    );
  };

  // Handlers for Tables & Orders modules
  const handleRefreshTables = async () => {
    if (!hotel) return;
    const { data } = await supabase
      .from('hotel_tables')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('table_number');
    if (data) setTables(data);
  };

  const handleRefreshOrders = async () => {
    if (!hotel) return;
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const handleRefreshWaiterCalls = async () => {
    if (!hotel) return;
    const { data } = await supabase
      .from('waiter_calls')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false });
    if (data) setWaiterCalls(data);
  };

  // Handlers for Settings module
  const handleUpdateHotel = async (updatedFields: Partial<Hotel>) => {
    if (!hotel) return;
    await supabase.from('hotels').update(updatedFields).eq('id', hotel.id);
    setHotel((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  if (loading && !hotel) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">Loading Hotel Admin Console...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-400">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-white text-lg font-bold">Hotel not found</p>
          <p className="text-xs">The hotel slug "{activeHotelSlug}" does not exist in the database.</p>
        </div>
      </div>
    );
  }

  const guestUrl = buildHotelGuestUrl(hotel.slug);

  const pendingCallsCount = waiterCalls.filter((c) => c.status !== 'resolved').length;
  const activeOrdersCount = orders.filter((o) =>
    ['pending', 'confirmed', 'in_kitchen', 'ready'].includes(o.status)
  ).length;

  const tabs: { id: AdminModuleTab; label: string; icon: any; count?: number; highlight?: boolean }[] = [
    {
      id: 'orders',
      label: 'Live Orders & Waiter',
      icon: ChefHat,
      count: activeOrdersCount || pendingCallsCount,
      highlight: pendingCallsCount > 0,
    },
    { id: 'tables', label: 'Floor & Tables', icon: LayoutGrid, count: tables.length },
    { id: 'menu', label: 'Menu & Dishes', icon: UtensilsCrossed, count: menuItems.length },
    { id: 'accounting', label: 'Accounting & Ledger', icon: Coins, count: transactions.length },
    { id: 'staff', label: 'Staff & Roles', icon: Users, count: memberships.length },
    { id: 'qrcode', label: 'QR Code & Tent Cards', icon: QrCode },
    { id: 'api', label: 'API Keys & Quotas', icon: Key, count: apiKeys.length },
    { id: 'settings', label: 'Hotel Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">{hotel.name}</h1>
                <Badge variant="purple" size="sm">
                  {subscription?.plan?.name || 'Starter Plan'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">Hotel Admin Management Console</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tenant switcher dropdown */}
            <div className="relative">
              <select
                value={activeHotelSlug}
                onChange={(e) => setActiveHotelSlug(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500 pr-8 cursor-pointer"
              >
                {allHotels.map((h) => (
                  <option key={h.id} value={h.slug}>
                    Switch: {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Guest Menu preview button */}
            <button
              onClick={() => {
                if (onNavigateToGuest) {
                  onNavigateToGuest(hotel.slug);
                } else {
                  window.open(guestUrl, '_blank');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Guest Menu
            </button>
          </div>
        </div>

        {/* Module Sub-Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'border-orange-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-500'}`} />
                {tab.label}
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-orange-500/20 text-orange-300' : 'bg-slate-800 text-slate-400'
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

      {/* Main Module Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'orders' && (
          <OrdersModule
            hotel={hotel}
            orders={orders}
            waiterCalls={waiterCalls}
            tables={tables}
            menuItems={menuItems}
            accounts={accounts}
            accountingCategories={accountingCategories}
            onRefreshOrders={handleRefreshOrders}
            onRefreshWaiterCalls={handleRefreshWaiterCalls}
            onRefreshLedger={() => {
              supabase
                .from('hotel_financial_transactions')
                .select('*, account:hotel_financial_accounts(*), category:hotel_accounting_categories(*)')
                .eq('hotel_id', hotel.id)
                .order('transaction_date', { ascending: false })
                .then(({ data }) => data && setTransactions(data));
              supabase
                .from('hotel_financial_accounts')
                .select('*')
                .eq('hotel_id', hotel.id)
                .then(({ data }) => data && setAccounts(data));
            }}
          />
        )}

        {activeTab === 'tables' && (
          <TablesModule
            hotel={hotel}
            tables={tables}
            onRefreshTables={handleRefreshTables}
          />
        )}

        {activeTab === 'menu' && (
          <MenuModule
            hotelId={hotel.id}
            currencySymbol={hotel.currency_symbol || '$'}
            categories={categories}
            menuItems={menuItems}
            subscription={subscription}
            onSaveDish={handleSaveDish}
            onDeleteDish={handleDeleteDish}
            onToggleAvailability={handleToggleDishAvailability}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'accounting' && (
          <AccountingModule
            hotelId={hotel.id}
            currencySymbol={hotel.currency_symbol || '$'}
            accounts={accounts}
            categories={accountingCategories}
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onVoidTransaction={handleVoidTransaction}
          />
        )}

        {activeTab === 'staff' && (
          <StaffModule
            hotelId={hotel.id}
            memberships={memberships}
            invitations={invitations}
            roles={roles}
            subscription={subscription}
            onSendInvitation={handleSendInvitation}
            onRevokeInvitation={handleRevokeInvitation}
            onRemoveMembership={handleRemoveMembership}
          />
        )}

        {activeTab === 'qrcode' && <QRCodeModule hotel={hotel} />}

        {activeTab === 'api' && (
          <ApiModule
            hotelId={hotel.id}
            apiKeys={apiKeys}
            subscription={subscription}
            onCreateApiKey={handleCreateApiKey}
            onRevokeApiKey={handleRevokeApiKey}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModule
            hotel={hotel}
            subscription={subscription}
            onUpdateHotel={handleUpdateHotel}
          />
        )}
      </main>
    </div>
  );
};
