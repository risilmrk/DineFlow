import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  LayoutGrid,
  BellRing,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  RefreshCw,
  Plus,
  Building2,
  ExternalLink,
  Receipt,
  Utensils,
  Check,
} from 'lucide-react';
import {
  Hotel,
  HotelTable,
  Order,
  WaiterCall,
  MenuItem,
  FinancialAccount,
  AccountingCategory,
  supabase,
} from '@dineflow/database';
import { Badge, Modal } from '@dineflow/ui';
import { OrdersModule } from '../../apps/admin/src/modules/orders/OrdersModule';

interface WaiterPanelProps {
  hotelSlug: string;
  onNavigateToHotelAdmin: (slug: string) => void;
  onNavigateToGuest: (slug: string) => void;
}

export const WaiterPanel: React.FC<WaiterPanelProps> = ({
  hotelSlug,
  onNavigateToHotelAdmin,
  onNavigateToGuest,
}) => {
  const [activeSlug, setActiveSlug] = useState<string>(hotelSlug);
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [tables, setTables] = useState<HotelTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [accountingCategories, setAccountingCategories] = useState<AccountingCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab: 'floor' | 'kitchen'
  const [activeTab, setActiveTab] = useState<'floor' | 'kitchen'>('floor');
  const [selectedTable, setSelectedTable] = useState<HotelTable | null>(null);

  // Fetch all hotels
  useEffect(() => {
    supabase
      .from('hotels')
      .select('*')
      .order('name')
      .then(({ data }) => data && setAllHotels(data));
  }, []);

  // Fetch hotel data
  const loadHotelData = async () => {
    try {
      setLoading(true);
      const { data: hotelData } = await supabase
        .from('hotels')
        .select('*')
        .eq('slug', activeSlug)
        .maybeSingle();

      if (hotelData) {
        setHotel(hotelData);

        const [tablesRes, ordersRes, callsRes, itemsRes, accRes, catRes] = await Promise.all([
          supabase.from('hotel_tables').select('*').eq('hotel_id', hotelData.id).order('table_number'),
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
          supabase.from('menu_items').select('*').eq('hotel_id', hotelData.id).order('sort_order'),
          supabase.from('hotel_financial_accounts').select('*').eq('hotel_id', hotelData.id),
          supabase.from('hotel_accounting_categories').select('*').eq('hotel_id', hotelData.id),
        ]);

        setTables(tablesRes.data || []);
        setOrders(ordersRes.data || []);
        setWaiterCalls(callsRes.data || []);
        setMenuItems(itemsRes.data || []);
        setAccounts(accRes.data || []);
        setAccountingCategories(catRes.data || []);
      }
    } catch (err) {
      console.error('Error loading waiter panel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotelData();
  }, [activeSlug]);

  if (loading && !hotel) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Connecting Waiter Station...
          </p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-400 text-center">
        <div>
          <h3 className="text-lg font-bold text-white">Hotel not found</h3>
          <p className="text-xs text-slate-400 mt-1">Slug: {activeSlug}</p>
        </div>
      </div>
    );
  }

  const pendingCalls = waiterCalls.filter((c) => c.status !== 'resolved');
  const activeOrders = orders.filter((o) =>
    ['pending', 'confirmed', 'in_kitchen', 'ready'].includes(o.status)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Waiter Station Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">{hotel.name}</h1>
                <Badge variant="warning" size="sm">
                  Waiter & POS Station
                </Badge>
              </div>
              <p className="text-xs text-slate-400">Live Dining Floor & Order Dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeSlug}
              onChange={(e) => setActiveSlug(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {allHotels.map((h) => (
                <option key={h.id} value={h.slug}>
                  {h.name}
                </option>
              ))}
            </select>

            <button
              onClick={loadHotelData}
              title="Refresh Data"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToHotelAdmin(hotel.slug)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Admin Console
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('floor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'floor'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Live Floor Plan ({tables.length} Tables)
            {pendingCalls.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('kitchen')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'kitchen'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            Kitchen Orders Feed ({activeOrders.length})
          </button>
        </div>
      </header>

      {/* Main Waiter Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'floor' && (
          <div className="space-y-6">
            {/* Service Alert Cards */}
            {pendingCalls.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <BellRing className="w-4 h-4 animate-bounce" />
                  Urgent Table Assistance Requests ({pendingCalls.length})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pendingCalls.map((call) => (
                    <div
                      key={call.id}
                      className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex items-start justify-between gap-3 shadow-xl ring-1 ring-amber-500/20"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">
                          Table {call.table_number}
                        </div>
                        <div className="text-xs font-semibold text-amber-300 capitalize mt-0.5">
                          {call.request_type.replace('_', ' ')}
                        </div>
                        {call.custom_note && (
                          <div className="text-[11px] text-slate-300 italic mt-0.5">
                            "{call.custom_note}"
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(call.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={async () => {
                            await supabase
                              .from('waiter_calls')
                              .update({ status: 'resolved', resolved_at: new Date().toISOString() })
                              .eq('id', call.id);
                            loadHotelData();
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tables Floor Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {tables.map((table) => {
                const isCalling = table.status === 'calling_waiter';
                const isOccupied = table.status === 'occupied';
                const tableOrder = orders.find(
                  (o) =>
                    o.table_number === table.table_number &&
                    ['pending', 'confirmed', 'in_kitchen', 'ready', 'served'].includes(o.status)
                );

                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`p-4 rounded-2xl border transition duration-150 cursor-pointer flex flex-col justify-between select-none ${
                      isCalling
                        ? 'bg-amber-950/50 border-amber-500 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40 animate-pulse'
                        : isOccupied
                        ? 'bg-blue-950/40 border-blue-500/50 hover:border-blue-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-white">{table.table_number}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          👥 {table.capacity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {table.section || 'Main Dining'}
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-bold capitalize ${
                            table.status === 'available'
                              ? 'text-emerald-400'
                              : table.status === 'occupied'
                              ? 'text-blue-400'
                              : table.status === 'calling_waiter'
                              ? 'text-amber-400'
                              : 'text-purple-400'
                          }`}
                        >
                          {table.status.replace('_', ' ')}
                        </span>
                        {tableOrder && (
                          <span className="font-mono text-orange-400 font-bold">
                            {hotel.currency_symbol || '$'}
                            {tableOrder.total_amount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'kitchen' && (
          <OrdersModule
            hotel={hotel}
            orders={orders}
            waiterCalls={waiterCalls}
            tables={tables}
            menuItems={menuItems}
            accounts={accounts}
            accountingCategories={accountingCategories}
            onRefreshOrders={loadHotelData}
            onRefreshWaiterCalls={loadHotelData}
          />
        )}
      </main>

      {/* Selected Table Quick Modal */}
      {selectedTable && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTable(null)}
          title={`Table ${selectedTable.table_number} Details`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Section: </span>
                <strong className="text-white">{selectedTable.section}</strong>
              </div>
              <div>
                <span className="text-slate-400">Capacity: </span>
                <strong className="text-white">{selectedTable.capacity} Seats</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Change Table Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['available', 'occupied', 'calling_waiter', 'reserved'].map((st) => (
                  <button
                    key={st}
                    onClick={async () => {
                      await supabase
                        .from('hotel_tables')
                        .update({ status: st, updated_at: new Date().toISOString() })
                        .eq('id', selectedTable.id);
                      setSelectedTable((prev) => (prev ? { ...prev, status: st as any } : null));
                      loadHotelData();
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition cursor-pointer ${
                      selectedTable.status === st
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-between gap-2 border-t border-slate-800">
              <a
                href={`/?hotel=${hotel.slug}&table=${encodeURIComponent(
                  selectedTable.table_number
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Guest Menu for Table
              </a>

              <button
                onClick={() => setSelectedTable(null)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
