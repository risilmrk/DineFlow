import React, { useState } from 'react';
import {
  FileText,
  DollarSign,
  Plus,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import {
  PlatformInvoice,
  PlatformPayment,
  Hotel,
} from '@dineflow/database';
import { AccountingEngine, PlatformBillingSummary } from '@dineflow/core';
import { Button, Badge, StatCard, Modal } from '@dineflow/ui';

interface BillingModuleProps {
  invoices: PlatformInvoice[];
  hotels: Hotel[];
  onRecordPayment: (payment: {
    invoice_id: string;
    hotel_id: string;
    amount: number;
    payment_method: 'bank_transfer' | 'wire' | 'credit_card_manual' | 'cash' | 'cheque' | 'other';
    reference_number?: string;
    notes?: string;
  }) => Promise<void>;
}

export const BillingModule: React.FC<BillingModuleProps> = ({
  invoices,
  hotels,
  onRecordPayment,
}) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PlatformInvoice | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<'bank_transfer' | 'wire' | 'credit_card_manual' | 'cash'>(
    'bank_transfer'
  );
  const [refNum, setRefNum] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute live billing analytics
  const summary: PlatformBillingSummary = AccountingEngine.calculatePlatformBillingSummary(invoices);

  const handleOpenPayment = (inv: PlatformInvoice) => {
    setSelectedInvoice(inv);
    const balance = Math.max(0, Number(inv.total_amount) - Number(inv.paid_amount || 0));
    setAmount(balance);
    setError(null);
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (amount <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      await onRecordPayment({
        invoice_id: selectedInvoice.id,
        hotel_id: selectedInvoice.hotel_id,
        amount,
        payment_method: method,
        reference_number: refNum.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setIsSubmitting(false);
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Error recording payment');
    }
  };

  const handleExportCsv = () => {
    const csvContent = AccountingEngine.exportInvoicesToCsv(invoices);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dineflow_platform_invoices_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Platform Invoiced"
          value={`$${summary.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="SaaS billed revenue"
          icon={FileText}
          variant="sky"
        />

        <StatCard
          title="Total Cash Collected"
          value={`$${summary.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle={`${summary.collectionRatePercent}% collection rate`}
          icon={CheckCircle}
          variant="emerald"
        />

        <StatCard
          title="Outstanding Receivables"
          value={`$${summary.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Pending subscription revenue"
          icon={Clock}
          variant={summary.totalOutstanding > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Invoice Status Breakdown"
          value={`${summary.paidCount} Paid / ${summary.unpaidCount + summary.overdueCount} Due`}
          subtitle={`${summary.overdueCount} overdue accounts`}
          icon={CreditCard}
          variant="orange"
        />
      </div>

      {/* Invoices List Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">Platform Invoices & Collections</h3>
          <p className="text-xs text-slate-400">
            Tenant subscription billing cycles, manual wire confirmations, and platform ledger.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={FileSpreadsheet} onClick={handleExportCsv}>
          Export Invoices CSV
        </Button>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold uppercase">Invoice #</th>
                <th className="py-3.5 px-4 font-semibold uppercase">Hotel Tenant</th>
                <th className="py-3.5 px-4 font-semibold uppercase">Issue Date</th>
                <th className="py-3.5 px-4 font-semibold uppercase">Due Date</th>
                <th className="py-3.5 px-4 font-semibold uppercase text-right">Total</th>
                <th className="py-3.5 px-4 font-semibold uppercase text-right">Paid</th>
                <th className="py-3.5 px-4 font-semibold uppercase text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.map((inv) => {
                const hotel = hotels.find((h) => h.id === inv.hotel_id);
                const isPaid = Number(inv.paid_amount) >= Number(inv.total_amount);

                return (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-white">{hotel?.name || 'Hotel Account'}</p>
                      <p className="text-slate-400 text-[11px]">{hotel?.slug}.localhost</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{inv.issue_date}</td>
                    <td className="py-3.5 px-4 text-slate-400">{inv.due_date}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ${Number(inv.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      ${Number(inv.paid_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          isPaid
                            ? 'success'
                            : inv.status === 'overdue'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!isPaid && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {invoices.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            No invoices generated yet.
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title={`Record Payment for ${selectedInvoice.invoice_number}`}
          description="Log wire transfers, cash or card payments collected directly from the hotel owner."
          maxWidth="md"
        >
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 rounded-xl text-xs">
                {error}
              </div>
            )}

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Invoice Total:</span>
                <span className="text-white font-bold">${Number(selectedInvoice.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Already Paid:</span>
                <span className="text-emerald-400 font-bold">${Number(selectedInvoice.paid_amount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Payment Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Method *</label>
              <select
                value={method}
                onChange={(e: any) => setMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
              >
                <option value="bank_transfer">Bank Wire / ACH</option>
                <option value="credit_card_manual">Manual Credit Card Charge</option>
                <option value="cash">Direct Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Reference / Transaction ID</label>
              <input
                type="text"
                value={refNum}
                onChange={(e) => setRefNum(e.target.value)}
                placeholder="e.g. WIRE-884912 or REF-409"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" isLoading={isSubmitting}>
                Confirm Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
