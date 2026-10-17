import React, { useState } from 'react';
import {
  ChefHat,
  BellRing,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  DollarSign,
  Utensils,
  Receipt,
  Eye,
  Filter,
  Check,
  X,
  CreditCard,
  Banknote,
  Search,
} from 'lucide-react';
import {
  Hotel,
  Order,
  OrderItem,
  OrderStatus,
  OrderPaymentStatus,
  WaiterCall,
  HotelTable,
  MenuItem,
  FinancialAccount,
  AccountingCategory,
  supabase,
} from '@dineflow/database';
import { Badge, Modal } from '@dineflow/ui';

interface OrdersModuleProps {
  hotel: Hotel;
  orders: Order[];
  waiterCalls: WaiterCall[];
  tables: HotelTable[];
  menuItems: MenuItem[];
  accounts: FinancialAccount[];
  accountingCategories: AccountingCategory[];
  onRefreshOrders: () => void;
  onRefreshWaiterCalls: () => void;
  onRefreshLedger?: () => void;
}

export const OrdersModule: React.FC<OrdersModuleProps> = ({
  hotel,
  orders,
  waiterCalls,
  tables,
  menuItems,
  accounts,
  accountingCategories,
  onRefreshOrders,
  onRefreshWaiterCalls,
  onRefreshLedger,
}) => {
  const [filterTab, setFilterTab] = useState<'active' | 'served' | 'all'>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settlingOrder, setSettlingOrder] = useState<Order | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'bank_transfer' | 'upi'>('credit_card');
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);

  // Manual order form state
  const [manualTableNumber, setManualTableNumber] = useState(tables[0]?.table_number || 'T-01');
  const [manualGuestName, setManualGuestName] = useState('');
  const [manualInstructions, setManualInstructions] = useState('');
  const [manualCart, setManualCart] = useState<{ item: MenuItem; quantity: number; notes: string }[]>([]);
  const [savingManualOrder, setSavingManualOrder] = useState(false);

  // Filter orders
  const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'in_kitchen', 'ready'];
  const filteredOrders = orders.filter((o) => {
    if (filterTab === 'active') return activeStatuses.includes(o.status);
    if (filterTab === 'served') return o.status === 'served' || o.status === 'completed';
    return true;
  });

  // Active waiter calls
  const pendingCalls = waiterCalls.filter((c) => c.status !== 'resolved');

  // Status progression map
  const getNextStatusAction = (currentStatus: OrderStatus): { label: string; nextStatus: OrderStatus } | null => {
    switch (currentStatus) {
      case 'pending':
        return { label: 'Confirm Order', nextStatus: 'confirmed' };
      case 'confirmed':
        return { label: 'Send to Kitchen', nextStatus: 'in_kitchen' };
      case 'in_kitchen':
        return { label: 'Mark Ready', nextStatus: 'ready' };
      case 'ready':
        return { label: 'Mark as Served', nextStatus: 'served' };
      case 'served':
        return { label: 'Complete & Close', nextStatus: 'completed' };
      default:
        return null;
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      onRefreshOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const handleUpdateCallStatus = async (callId: string, newStatus: 'attending' | 'resolved') => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase.from('waiter_calls').update(updateData).eq('id', callId);
      if (error) throw error;
      onRefreshWaiterCalls();
    } catch (err) {
      console.error('Error updating waiter call:', err);
    }
  };

  const handleOpenSettleModal = (order: Order) => {
    setSettlingOrder(order);
    if (accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
    setIsSettleModalOpen(true);
  };

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingOrder) return;
    setIsSubmittingSettle(true);
    try {
      // 1. Mark order as paid & completed
      const { error: orderErr } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_method: paymentMethod,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', settlingOrder.id);

      if (orderErr) throw orderErr;

      // 2. If an account is selected, record into hotel financial ledger
      if (selectedAccountId) {
        const incomeCat = accountingCategories.find((c) => c.type === 'income');
        await supabase.from('hotel_financial_transactions').insert({
          hotel_id: hotel.id,
          account_id: selectedAccountId,
          category_id: incomeCat ? incomeCat.id : null,
          type: 'income',
          amount: settlingOrder.total_amount,
          transaction_date: new Date().toISOString().split('T')[0],
          description: `Dining Settlement Table ${settlingOrder.table_number} (${settlingOrder.order_number})`,
          payment_method: paymentMethod,
          reference_number: settlingOrder.order_number,
          is_voided: false,
        });

        if (onRefreshLedger) onRefreshLedger();
      }

      setIsSettleModalOpen(false);
      setSettlingOrder(null);
      onRefreshOrders();
    } catch (err) {
      console.error('Error settling order:', err);
      alert('Could not complete payment settlement');
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  // Manual order handling
  const handleAddItemToManualCart = (item: MenuItem) => {
    setManualCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) => (i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { item, quantity: 1, notes: '' }];
    });
  };

  const handleRemoveManualItem = (itemId: string) => {
    setManualCart((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const handleSaveManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCart.length === 0) {
      alert('Please add at least one dish to the order');
      return;
    }
    setSavingManualOrder(true);
    try {
      const subtotal = manualCart.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
      const tax = Number((subtotal * 0.09).toFixed(2));
      const total = Number((subtotal + tax).toFixed(2));
      const orderNum = `ORD-${Math.floor(100 + Math.random() * 900)}`;

      const matchingTable = tables.find((t) => t.table_number === manualTableNumber);

      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          hotel_id: hotel.id,
          table_id: matchingTable ? matchingTable.id : null,
          table_number: manualTableNumber,
          order_number: orderNum,
          guest_name: manualGuestName || `Guest @ ${manualTableNumber}`,
          status: 'confirmed',
          subtotal,
          tax_amount: tax,
          total_amount: total,
          payment_status: 'unpaid',
          special_instructions: manualInstructions || null,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Insert line items
      const itemsPayload = manualCart.map((ci) => ({
        order_id: newOrder.id,
        menu_item_id: ci.item.id,
        item_name: ci.item.name,
        unit_price: ci.item.price,
        quantity: ci.quantity,
        total_price: ci.item.price * ci.quantity,
        special_notes: ci.notes || null,
      }));

      await supabase.from('order_items').insert(itemsPayload);

      // Set table to occupied
      if (matchingTable) {
        await supabase
          .from('hotel_tables')
          .update({ status: 'occupied', updated_at: new Date().toISOString() })
          .eq('id', matchingTable.id);
      }

      setIsNewOrderModalOpen(false);
      setManualCart([]);
      setManualGuestName('');
      setManualInstructions('');
      onRefreshOrders();
    } catch (err) {
      console.error('Error placing manual waiter order:', err);
      alert('Could not submit order');
    } finally {
      setSavingManualOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            Live Orders & Waiter Station
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time kitchen order display (KDS), guest self-orders, waiter call notifications, and table bill settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Punch in Order
          </button>
        </div>
      </div>

      {/* Waiter Assistance Alert Banners */}
      {pendingCalls.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <BellRing className="w-4 h-4 animate-bounce" />
            Guest Service Calls ({pendingCalls.length} Active)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingCalls.map((call) => (
              <div
                key={call.id}
                className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 shadow-lg ${
                  call.status === 'attending'
                    ? 'bg-blue-950/40 border-blue-500/30 text-blue-200'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-200 animate-pulse'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Table {call.table_number}</span>
                    <Badge variant={call.status === 'attending' ? 'info' : 'warning'}>
                      {call.status}
                    </Badge>
                  </div>
                  <div className="text-xs font-semibold mt-1 capitalize text-amber-300">
                    {call.request_type.replace('_', ' ')}
                  </div>
                  {call.custom_note && (
                    <div className="text-[11px] text-slate-300 mt-0.5 italic">
                      "{call.custom_note}"
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {call.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateCallStatus(call.id, 'attending')}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold rounded-lg border border-amber-500/30 cursor-pointer"
                    >
                      Attending
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateCallStatus(call.id, 'resolved')}
                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold rounded-lg border border-emerald-500/30 cursor-pointer"
                  >
                    Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterTab === 'active'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Kitchen Queue ({orders.filter((o) => activeStatuses.includes(o.status)).length})
          </button>
          <button
            onClick={() => setFilterTab('served')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterTab === 'served'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Served / Completed ({orders.filter((o) => o.status === 'served' || o.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterTab === 'all'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Orders ({orders.length})
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Auto-synced with Guest Table App
        </div>
      </div>

      {/* Order Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center">
          <ChefHat className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Orders in this View</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            New orders placed by guests via QR codes or taken by waiters will instantly show up in this live feed.
          </p>
          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
          >
            Take Manual Order
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const nextAction = getNextStatusAction(order.status);
            const isUnpaid = order.payment_status === 'unpaid';

            return (
              <div
                key={order.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-xl transition"
              >
                <div>
                  {/* Order Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white tracking-wide">
                          {order.table_number}
                        </span>
                        <span className="text-xs font-mono text-orange-400 font-medium">
                          {order.order_number}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {order.guest_name || 'Guest'} •{' '}
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          order.status === 'pending'
                            ? 'warning'
                            : order.status === 'in_kitchen'
                            ? 'orange'
                            : order.status === 'ready'
                            ? 'info'
                            : order.status === 'served' || order.status === 'completed'
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {order.status.replace('_', ' ')}
                      </Badge>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isUnpaid
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {order.payment_status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Special Kitchen Notes */}
                  {order.special_instructions && (
                    <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                      <strong>Note:</strong> {order.special_instructions}
                    </div>
                  )}

                  {/* Ordered Items List */}
                  <div className="space-y-2 mb-4">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between text-xs py-1 border-b border-slate-800/40 last:border-0"
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-orange-400 w-5">
                              {item.quantity}x
                            </span>
                            <div>
                              <span className="text-white font-medium">{item.item_name}</span>
                              {item.special_notes && (
                                <p className="text-[10px] text-slate-400 italic">
                                  "{item.special_notes}"
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-slate-300 font-mono text-[11px]">
                            {hotel.currency_symbol || '$'}
                            {item.total_price.toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        Items loaded with order summary
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer with Bill & Next Actions */}
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-slate-400">Total Bill:</span>
                    <span className="text-base font-bold text-white font-mono">
                      {hotel.currency_symbol || '$'}
                      {order.total_amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {nextAction ? (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, nextAction.nextStatus)}
                        className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {nextAction.label}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2 bg-slate-800 text-slate-500 text-xs font-semibold rounded-xl"
                      >
                        Completed
                      </button>
                    )}

                    {isUnpaid ? (
                      <button
                        onClick={() => handleOpenSettleModal(order)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Settle Bill
                      </button>
                    ) : (
                      <div className="py-2 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Paid
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bill Settlement Modal */}
      <Modal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        title={settlingOrder ? `Settle Bill: ${settlingOrder.order_number}` : 'Settle Bill'}
      >
        {settlingOrder && (
          <form onSubmit={handleConfirmSettle} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs text-slate-400">
                Table {settlingOrder.table_number} • {settlingOrder.guest_name || 'Guest'}
              </div>
              <div className="text-3xl font-bold text-white font-mono my-2">
                {hotel.currency_symbol || '$'}
                {settlingOrder.total_amount.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400">
                Subtotal: {hotel.currency_symbol || '$'}
                {settlingOrder.subtotal.toFixed(2)} • Tax: {hotel.currency_symbol || '$'}
                {settlingOrder.tax_amount.toFixed(2)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'credit_card', label: 'Credit / POS Card', icon: CreditCard },
                  { id: 'cash', label: 'Cash Tendered', icon: Banknote },
                  { id: 'bank_transfer', label: 'Bank Transfer / Room', icon: Receipt },
                  { id: 'upi', label: 'UPI / Digital QR', icon: DollarSign },
                ].map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                        paymentMethod === pm.id
                          ? 'bg-orange-500/20 border-orange-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-orange-400" />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Post Directly to Hotel Ledger Account (Automatic Accounting)
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">Do not record in ledger (Skip)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name} ({acc.account_type.toUpperCase()} • Bal:{' '}
                    {hotel.currency_symbol || '$'}
                    {acc.current_balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSettleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSettle}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                {isSubmittingSettle ? 'Processing...' : 'Confirm Payment & Complete'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Manual Waiter Order Modal */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title="Punch in Table Order (Waiter Station)"
      >
        <form onSubmit={handleSaveManualOrder} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Table *
              </label>
              <select
                value={manualTableNumber}
                onChange={(e) => setManualTableNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.table_number}>
                    Table {t.table_number} ({t.section})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Guest Name / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. VIP Party"
                value={manualGuestName}
                onChange={(e) => setManualGuestName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Dishes to Add
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-900 border border-slate-800 rounded-xl">
              {menuItems.map((dish) => (
                <div
                  key={dish.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 transition"
                >
                  <div>
                    <span className="text-xs font-medium text-white">{dish.name}</span>
                    <span className="text-[11px] text-orange-400 font-mono ml-2">
                      {hotel.currency_symbol || '$'}
                      {dish.price.toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddItemToManualCart(dish)}
                    className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart preview */}
          {manualCart.length > 0 && (
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Selected Items ({manualCart.reduce((sum, i) => sum + i.quantity, 0)})</span>
                <span className="text-orange-400 font-mono">
                  {hotel.currency_symbol || '$'}
                  {manualCart
                    .reduce((sum, i) => sum + i.item.price * i.quantity, 0)
                    .toFixed(2)}
                </span>
              </div>

              {manualCart.map((ci) => (
                <div key={ci.item.id} className="flex items-center justify-between text-xs text-slate-300">
                  <span>
                    {ci.quantity}x {ci.item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveManualItem(ci.item.id)}
                    className="text-rose-400 hover:text-rose-300 text-[10px]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Kitchen Special Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Allergies, less spicy, serve wine first"
              value={manualInstructions}
              onChange={(e) => setManualInstructions(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewOrderModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingManualOrder || manualCart.length === 0}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
            >
              {savingManualOrder ? 'Submitting Order...' : 'Send to Kitchen'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
