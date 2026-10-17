import React, { useState } from 'react';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ChefHat,
  AlertCircle,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { MenuItem, Hotel, HotelTable, supabase } from '@dineflow/database';

export interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: Hotel;
  tables: HotelTable[];
  selectedTableNumber: string;
  onSelectTableNumber: (tableNumber: string) => void;
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onOrderPlaced: (order: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  hotel,
  tables,
  selectedTableNumber,
  onSelectTableNumber,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onOrderPlaced,
}) => {
  const [guestName, setGuestName] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  const tax = Number((subtotal * 0.09).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const totalQuantity = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!selectedTableNumber) {
      setErrorMsg('Please select your table number');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const orderNumber = `ORD-${Math.floor(100 + Math.random() * 900)}`;
      const matchingTable = tables.find((t) => t.table_number === selectedTableNumber);

      // 1. Create order
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          hotel_id: hotel.id,
          table_id: matchingTable ? matchingTable.id : null,
          table_number: selectedTableNumber,
          order_number: orderNumber,
          guest_name: guestName.trim() || `Table ${selectedTableNumber} Guest`,
          status: 'pending',
          subtotal,
          tax_amount: tax,
          total_amount: total,
          payment_status: 'unpaid',
          special_instructions: specialInstructions.trim() || null,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Insert order items
      const itemsPayload = cart.map((ci) => ({
        order_id: orderData.id,
        menu_item_id: ci.item.id,
        item_name: ci.item.name,
        unit_price: ci.item.price,
        quantity: ci.quantity,
        total_price: ci.item.price * ci.quantity,
        special_notes: ci.notes || null,
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      // 3. Mark table as occupied
      if (matchingTable && matchingTable.status === 'available') {
        await supabase
          .from('hotel_tables')
          .update({ status: 'occupied', updated_at: new Date().toISOString() })
          .eq('id', matchingTable.id);
      }

      onOrderPlaced({ ...orderData, items: itemsPayload });
      onClose();
    } catch (err: any) {
      console.error('Error placing guest self-order:', err);
      setErrorMsg(err.message || 'Failed to submit order. Please try again or alert staff.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Your Order</h3>
              <p className="text-[11px] text-slate-400">
                {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Table Selector */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Dining Table
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedTableNumber}
                onChange={(e) => onSelectTableNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="">-- Choose your table --</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.table_number}>
                    Table {t.table_number} ({t.section || 'Main Dining'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <ChefHat className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-xs">Your order tray is currently empty.</p>
              <p className="text-[11px]">Select items from the menu to start ordering.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cart.map((ci) => (
                <div
                  key={ci.item.id}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">{ci.item.name}</div>
                    <div className="text-xs text-orange-400 font-mono mt-0.5">
                      {hotel.currency_symbol || '$'}
                      {(ci.item.price * ci.quantity).toFixed(2)}
                    </div>
                    {ci.notes && (
                      <div className="text-[10px] text-slate-400 italic mt-1">
                        Note: {ci.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-900 border border-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => onUpdateQuantity(ci.item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white w-5 text-center font-mono">
                      {ci.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(ci.item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-orange-600 hover:bg-orange-500 flex items-center justify-center text-white transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Guest Name & Instructions */}
          {cart.length > 0 && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Special Kitchen Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Allergy info, dressing on the side, extra spicy..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer & Submit */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono">
                  {hotel.currency_symbol || '$'}
                  {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Tax (9%)</span>
                <span className="font-mono">
                  {hotel.currency_symbol || '$'}
                  {tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-slate-800">
                <span>Total</span>
                <span className="font-mono text-orange-400">
                  {hotel.currency_symbol || '$'}
                  {total.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={submitting || !selectedTableNumber}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ChefHat className="w-4 h-4" />
              {submitting ? 'Sending Order to Kitchen...' : 'Send Order to Kitchen'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
