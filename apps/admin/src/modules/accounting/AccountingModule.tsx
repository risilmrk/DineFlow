import React, { useState } from 'react';
import {
  Coins,
  Plus,
  FileSpreadsheet,
  Ban,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  FinancialAccount,
  AccountingCategory,
  FinancialTransaction,
} from '@dineflow/database';
import { AccountingEngine, HotelFinancialSummary } from '@dineflow/core';
import { Button, Badge } from '@dineflow/ui';
import { FinancialSummary } from './FinancialSummary';
import { TransactionModal } from './TransactionModal';
import { VoidTransactionModal } from './VoidTransactionModal';

interface AccountingModuleProps {
  hotelId: string;
  currencySymbol: string;
  accounts: FinancialAccount[];
  categories: AccountingCategory[];
  transactions: FinancialTransaction[];
  onAddTransaction: (tx: Partial<FinancialTransaction>) => Promise<void>;
  onVoidTransaction: (txId: string, reason: string) => Promise<void>;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  hotelId,
  currencySymbol,
  accounts,
  categories,
  transactions,
  onAddTransaction,
  onVoidTransaction,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [selectedTxToVoid, setSelectedTxToVoid] = useState<FinancialTransaction | null>(null);

  // Compute live mathematical financial summary
  const summary: HotelFinancialSummary = AccountingEngine.calculateHotelSummary(
    transactions,
    accounts
  );

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesAccount = filterAccount === 'all' || t.account_id === filterAccount;
    return matchesType && matchesAccount;
  });

  const handleOpenVoid = (tx: FinancialTransaction) => {
    setSelectedTxToVoid(tx);
    setIsVoidModalOpen(true);
  };

  const handleExportCsv = () => {
    const csvContent = AccountingEngine.exportTransactionsToCsv(transactions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dineflow_financial_ledger_${hotelId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Cards */}
      <FinancialSummary summary={summary} currencySymbol={currencySymbol} />

      {/* Accounts Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-white text-sm">Designated Accounts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
            >
              <div>
                <p className="text-white font-medium text-sm">{acc.account_name}</p>
                <p className="text-xs text-slate-400 capitalize">
                  {acc.account_type} {acc.account_number_last4 ? `(•• ${acc.account_number_last4})` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-sm">
                  {currencySymbol}
                  {Number(acc.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <Badge variant={acc.is_active ? 'success' : 'outline'} size="sm">
                  {acc.is_active ? 'Active' : 'Archived'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ledger Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterType === 'all' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterType === 'income' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Income Only
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterType === 'expense' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Expenses Only
            </button>
          </div>

          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.account_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsTxModalOpen(true)}
          >
            Record Transaction
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Date</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Type</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Category & Account</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Description</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-right">Amount</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className={`hover:bg-slate-800/40 transition ${
                    tx.is_voided ? 'opacity-40 bg-slate-950/40' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                    {tx.transaction_date}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {tx.type === 'income' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Income
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                        <ArrowDownRight className="w-3.5 h-3.5" /> Expense
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-white">{tx.category?.name || 'Uncategorized'}</p>
                    <p className="text-[11px] text-slate-400">{tx.account?.account_name || 'General'}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                    {tx.description}
                    {tx.reference_number && (
                      <span className="text-slate-400 ml-1">({tx.reference_number})</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span
                      className={`font-bold ${
                        tx.is_voided
                          ? 'line-through text-slate-500'
                          : tx.type === 'income'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {currencySymbol}
                      {Number(tx.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {tx.is_voided ? (
                      <Badge variant="danger" size="sm">
                        Voided
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        Recorded
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {!tx.is_voided ? (
                      <button
                        onClick={() => handleOpenVoid(tx)}
                        className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                      >
                        Void
                      </button>
                    ) : (
                      <span
                        className="text-[11px] text-slate-400 cursor-help"
                        title={tx.void_reason || 'No reason provided'}
                      >
                        Reason Logged
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-10">
            <Coins className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">No transactions match your filter</p>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onSave={onAddTransaction}
      />

      {/* Void Modal */}
      <VoidTransactionModal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        transaction={selectedTxToVoid}
        currencySymbol={currencySymbol}
        onConfirmVoid={onVoidTransaction}
      />
    </div>
  );
};
