import React from 'react';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Sparkles,
  UtensilsCrossed,
  Receipt,
  X,
  RefreshCw,
  BellRing,
} from 'lucide-react';
import { Order, OrderStatus, Hotel } from '@dineflow/database';
import { Badge } from '@dineflow/ui';

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  hotel: Hotel;
  onRefreshOrder: () => void;
  onOpenCallWaiter: () => void;
  onAddMoreItems: () => void;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  isOpen,
  onClose,
  order,
  hotel,
  onRefreshOrder,
  onOpenCallWaiter,
  onAddMoreItems,
}) => {
  if (!isOpen || !order) return null;

  const steps: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
    {
      status: 'pending',
      label: 'Order Sent',
      desc: 'Received by front desk & servers',
      icon: Clock,
    },
    {
      status: 'confirmed',
      label: 'Staff Confirmed',
      desc: 'Acknowledged and queued',
      icon: CheckCircle2,
    },
    {
      status: 'in_kitchen',
      label: 'Cooking in Kitchen',
      desc: 'Chefs are preparing your dishes',
      icon: ChefHat,
    },
    {
      status: 'ready',
      label: 'Plated & Ready',
      desc: 'Dishes ready for delivery',
      icon: UtensilsCrossed,
    },
    {
      status: 'served',
      label: 'Served to Table',
      desc: 'Enjoy your artisan meal!',
      icon: Sparkles,
    },
  ];

  const getStepIndex = (st: OrderStatus): number => {
    switch (st) {
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'in_kitchen':
        return 2;
      case 'ready':
        return 3;
      case 'served':
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-orange-400 font-bold">
                {order.order_number}
              </span>
              <Badge variant="orange" size="sm">
                Table {order.table_number}
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Live Order Status</h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onRefreshOrder}
              title="Refresh Status"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Tracker Stepper */}
        <div className="space-y-3 py-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={s.status} className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-orange-500 text-white ring-4 ring-orange-500/20 animate-pulse'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div
                    className={`text-xs font-bold ${
                      isCurrent ? 'text-orange-400' : isCompleted ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="text-[10px] text-slate-400">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Items Breakdown */}
        <div className="space-y-2 border-t border-slate-800 pt-4">
          <div className="text-xs font-bold text-slate-300">Items Ordered</div>
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {order.items &&
              order.items.map((i, idx) => (
                <div key={idx} className="flex justify-between text-xs text-slate-300">
                  <span>
                    <strong className="text-orange-400 font-mono">{i.quantity}x</strong>{' '}
                    {i.item_name}
                  </span>
                  <span className="font-mono text-slate-400">
                    {hotel.currency_symbol || '$'}
                    {i.total_price.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>

          <div className="border-t border-slate-800/80 pt-2 flex justify-between items-center text-sm font-bold text-white">
            <span>Bill Total</span>
            <span className="font-mono text-orange-400">
              {hotel.currency_symbol || '$'}
              {order.total_amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenCallWaiter();
            }}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            Call Server
          </button>

          <button
            onClick={() => {
              onClose();
              onAddMoreItems();
            }}
            className="py-2.5 px-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-orange-500/20"
          >
            <ChefHat className="w-3.5 h-3.5" />
            Add More Items
          </button>
        </div>
      </div>
    </div>
  );
};
