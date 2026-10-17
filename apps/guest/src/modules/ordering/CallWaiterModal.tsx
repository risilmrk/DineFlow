import React, { useState } from 'react';
import {
  BellRing,
  Droplet,
  Utensils,
  Receipt,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquare,
} from 'lucide-react';
import { Hotel, HotelTable, WaiterRequestType, supabase } from '@dineflow/database';

interface CallWaiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: Hotel;
  tables: HotelTable[];
  selectedTableNumber: string;
  onSelectTableNumber: (tableNumber: string) => void;
  onCallSent?: () => void;
}

export const CallWaiterModal: React.FC<CallWaiterModalProps> = ({
  isOpen,
  onClose,
  hotel,
  tables,
  selectedTableNumber,
  onSelectTableNumber,
  onCallSent,
}) => {
  const [requestType, setRequestType] = useState<WaiterRequestType>('call_waiter');
  const [customNote, setCustomNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const requestOptions: { type: WaiterRequestType; label: string; icon: any; hint: string }[] = [
    {
      type: 'call_waiter',
      label: 'General Assistance',
      icon: BellRing,
      hint: 'Ask questions or request server',
    },
    {
      type: 'water_refill',
      label: 'Water Refill',
      icon: Droplet,
      hint: 'Chilled still or sparkling water',
    },
    {
      type: 'bring_cutlery',
      label: 'Extra Cutlery & Napkins',
      icon: Utensils,
      hint: 'Plates, forks, steak knives, napkins',
    },
    {
      type: 'bring_bill',
      label: 'Bring the Bill',
      icon: Receipt,
      hint: 'Request card terminal or check',
    },
    {
      type: 'clean_table',
      label: 'Clean Table',
      icon: Sparkles,
      hint: 'Wipe surface or clear empty plates',
    },
  ];

  const handleSendCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableNumber) {
      setErrorMsg('Please select your dining table');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const matchingTable = tables.find((t) => t.table_number === selectedTableNumber);

      // 1. Insert into waiter_calls
      const { error: callErr } = await supabase.from('waiter_calls').insert({
        hotel_id: hotel.id,
        table_id: matchingTable ? matchingTable.id : null,
        table_number: selectedTableNumber,
        request_type: requestType,
        custom_note: customNote.trim() || null,
        status: 'pending',
      });

      if (callErr) throw callErr;

      // 2. Update table status to calling_waiter
      if (matchingTable) {
        await supabase
          .from('hotel_tables')
          .update({ status: 'calling_waiter', updated_at: new Date().toISOString() })
          .eq('id', matchingTable.id);
      }

      setIsSuccess(true);
      if (onCallSent) onCallSent();
      setTimeout(() => {
        setIsSuccess(false);
        setCustomNote('');
        onClose();
      }, 2200);
    } catch (err: any) {
      console.error('Error sending waiter call:', err);
      setErrorMsg(err.message || 'Could not send alert. Please notify staff directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Call Waiter / Server</h3>
              <p className="text-[11px] text-slate-400">Staff will be notified immediately</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">Server Alerted!</h4>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              A staff member has received your request for{' '}
              <strong className="text-orange-400">Table {selectedTableNumber}</strong> and will be
              with you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendCall} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Table Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Your Table Number *
              </label>
              <select
                value={selectedTableNumber}
                onChange={(e) => onSelectTableNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="">-- Select Table --</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.table_number}>
                    Table {t.table_number} ({t.section || 'Dining'})
                  </option>
                ))}
              </select>
            </div>

            {/* Request Type Tiles */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                What do you need?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {requestOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = requestType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setRequestType(opt.type)}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500/30'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isSelected ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-bold leading-tight">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.hint}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Note */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Additional Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Sparkling water with ice, extra lime..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedTableNumber}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <BellRing className="w-3.5 h-3.5" />
                {submitting ? 'Alerting Waiter...' : 'Notify Waiter'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
