import React, { useState, useEffect } from 'react';
import {
  Hotel,
  MenuCategory,
  MenuItem,
  HotelTable,
  Order,
  supabase,
} from '@dineflow/database';
import { GuestHeader } from './modules/header/GuestHeader';
import { GuestMenuModule } from './modules/menu/GuestMenuModule';
import { CartDrawer, CartItem } from './modules/ordering/CartDrawer';
import { OrderStatusModal } from './modules/ordering/OrderStatusModal';
import { CallWaiterModal } from './modules/ordering/CallWaiterModal';
import { ShoppingBag, BellRing, Clock, Utensils, CheckCircle2, ChevronRight } from 'lucide-react';

export interface GuestAppProps {
  hotelSlug: string;
}

export const GuestApp: React.FC<GuestAppProps> = ({ hotelSlug }) => {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<HotelTable[]>([]);
  const [loading, setLoading] = useState(true);

  // Table selection (read from ?table= URL query if present)
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>('');

  // Cart & Ordering state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);

  // Initialize table from URL query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam) {
      setSelectedTableNumber(decodeURIComponent(tableParam));
    }
  }, []);

  useEffect(() => {
    async function loadGuestMenu() {
      try {
        setLoading(true);
        // Fetch hotel record by slug
        const { data: hotelData } = await supabase
          .from('hotels')
          .select('*')
          .eq('slug', hotelSlug)
          .maybeSingle();

        if (hotelData) {
          setHotel(hotelData);

          // Fetch categories, dishes & tables in parallel
          const [catRes, itemRes, tablesRes] = await Promise.all([
            supabase
              .from('menu_categories')
              .select('*')
              .eq('hotel_id', hotelData.id)
              .eq('is_active', true)
              .order('sort_order'),
            supabase
              .from('menu_items')
              .select('*, category:menu_categories(*)')
              .eq('hotel_id', hotelData.id)
              .order('sort_order'),
            supabase
              .from('hotel_tables')
              .select('*')
              .eq('hotel_id', hotelData.id)
              .order('table_number'),
          ]);

          setCategories(catRes.data || []);
          setItems(itemRes.data || []);
          const fetchedTables = tablesRes.data || [];
          setTables(fetchedTables);

          // If no table selected and tables exist, pick first
          setSelectedTableNumber((prev) => {
            if (prev) return prev;
            return fetchedTables[0]?.table_number || 'T-01';
          });
        }
      } catch (err) {
        console.error('Error loading guest digital menu:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGuestMenu();
  }, [hotelSlug]);

  // Cart helper functions
  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((ci) => {
          if (ci.item.id === itemId) {
            const nextQty = ci.quantity + delta;
            return nextQty > 0 ? { ...ci, quantity: nextQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId));
  };

  const getItemQuantity = (itemId: string): number => {
    const found = cart.find((ci) => ci.item.id === itemId);
    return found ? found.quantity : 0;
  };

  const handleOrderPlaced = (order: Order) => {
    setActiveOrder(order);
    setCart([]);
    setIsStatusModalOpen(true);
  };

  const handleRefreshActiveOrder = async () => {
    if (!activeOrder) return;
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', activeOrder.id)
      .maybeSingle();
    if (data) setActiveOrder(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Loading Guest Menu...
          </p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-400 text-center">
        <div className="space-y-3 max-w-sm">
          <h2 className="text-xl font-bold text-white font-serif">Menu Unavailable</h2>
          <p className="text-xs text-slate-400">
            No active restaurant found for subdomain <code className="text-orange-400">{hotelSlug}</code>.
          </p>
        </div>
      </div>
    );
  }

  const totalCartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);
  const cartSubtotal = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-orange-500 selection:text-white pb-24">
      {/* Header */}
      <GuestHeader hotel={hotel} />

      {/* Table Banner & Quick Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400">Seated at:</span>
            <select
              value={selectedTableNumber}
              onChange={(e) => setSelectedTableNumber(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.table_number}>
                  Table {t.table_number} ({t.section || 'Main Dining'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {activeOrder && (
              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 font-semibold text-[11px] flex items-center gap-1.5 hover:bg-orange-500/20 transition cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 animate-spin" />
                Track Order ({activeOrder.order_number})
              </button>
            )}

            <button
              onClick={() => setIsCallWaiterOpen(true)}
              className="px-3 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-amber-500/10"
            >
              <BellRing className="w-3.5 h-3.5" />
              Call Server
            </button>
          </div>
        </div>
      </div>

      {/* Main Menu Feed */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-4xl w-full mx-auto">
        <GuestMenuModule
          categories={categories}
          items={items}
          currencySymbol={hotel.currency_symbol || '$'}
          onAddToCart={handleAddToCart}
          getItemQuantity={getItemQuantity}
        />
      </main>

      {/* Sticky Floating Bottom Bar for Cart / Order Action */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto animate-in slide-in-from-bottom duration-200">
          <div className="bg-slate-900/95 border border-orange-500/50 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-4 ring-1 ring-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-orange-500/40">
                {totalCartCount}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Your Order Tray</div>
                <div className="text-xs text-orange-400 font-mono font-semibold">
                  {hotel.currency_symbol || '$'}
                  {cartSubtotal.toFixed(2)} + tax
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-2 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Review Order</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        hotel={hotel}
        tables={tables}
        selectedTableNumber={selectedTableNumber}
        onSelectTableNumber={setSelectedTableNumber}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onOrderPlaced={handleOrderPlaced}
      />

      <OrderStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        order={activeOrder}
        hotel={hotel}
        onRefreshOrder={handleRefreshActiveOrder}
        onOpenCallWaiter={() => setIsCallWaiterOpen(true)}
        onAddMoreItems={() => setIsCartOpen(true)}
      />

      <CallWaiterModal
        isOpen={isCallWaiterOpen}
        onClose={() => setIsCallWaiterOpen(false)}
        hotel={hotel}
        tables={tables}
        selectedTableNumber={selectedTableNumber}
        onSelectTableNumber={setSelectedTableNumber}
      />

      {/* Discreet footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-[11px] text-slate-500">
        Digital Menu & Self-Ordering by DineFlow SaaS Platform
      </footer>
    </div>
  );
};
