import React, { useState } from 'react';
import { Ban, AlertTriangle } from 'lucide-react';
import { FinancialTransaction } from '@dineflow/database';
import { Modal, Button } from '@dineflow/ui';

interface VoidTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FinancialTransaction | null;
  currencySymbol: string;
  onConfirmVoid: (txId: string, reason: string) => Promise<void>;
}

export const VoidTransactionModal: React.FC<VoidTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  currencySymbol,
  onConfirmVoid,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A valid audit reason is required to void this financial entry.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmVoid(transaction.id, reason.trim());
      setIsSubmitting(false);
      setReason('');
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Error voiding transaction');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Void Financial Transaction"
      description="Voiding removes this entry from the net result calculation while maintaining an immutable audit log."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Transaction:</span>
            <span className="text-white font-medium">{transaction.description}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Type / Amount:</span>
            <span
              className={
                transaction.type === 'income' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
              }
            >
              {transaction.type.toUpperCase()}: {currencySymbol}
              {Number(transaction.amount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Account:</span>
            <span className="text-white">{transaction.account?.account_name || 'General'}</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">
            Mandatory Void Reason (Audit Requirement) *
          </label>
          <textarea
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Duplicate entry by shift cashier, refunded transaction #4091, or incorrect amount entered..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" icon={Ban} isLoading={isSubmitting}>
            Confirm Void
          </Button>
        </div>
      </form>
    </Modal>
  );
};
