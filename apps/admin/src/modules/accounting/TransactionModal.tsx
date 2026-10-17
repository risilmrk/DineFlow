import React, { useState } from 'react';
import { FinancialAccount, AccountingCategory, FinancialTransaction } from '@dineflow/database';
import { Modal, Button } from '@dineflow/ui';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  categories: AccountingCategory[];
  onSave: (tx: Partial<FinancialTransaction>) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  onSave,
}) => {
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    const finalCatId = categoryId || filteredCategories[0]?.id;
    if (!finalCatId) {
      setError('Please select or create an accounting category first');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        type,
        account_id: accountId || accounts[0]?.id,
        category_id: finalCatId,
        amount,
        description: description.trim(),
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || undefined,
        transaction_date: transactionDate,
      });
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setError(err.message || 'Error recording transaction');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Financial Transaction"
      description="Track restaurant income or operational expenses across cash and bank accounts."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            + Income
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            - Expense
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Target Account *</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_name} ({a.account_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Category *</label>
            <select
              value={categoryId || filteredCategories[0]?.id}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Date</label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Description *</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            placeholder="e.g. Daily dinner revenue or Seafood distributor invoice #8841"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="cash">Cash in Drawer</option>
              <option value="bank_transfer">Bank Wire / Transfer</option>
              <option value="pos_card">Credit / POS Terminal</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Reference / Receipt #</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              placeholder="e.g. REC-9921"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={type === 'income' ? 'success' : 'danger'}
            isLoading={isSaving}
          >
            Record {type === 'income' ? 'Income' : 'Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
