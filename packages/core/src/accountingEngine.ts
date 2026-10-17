// ==============================================================================
// DineFlow Accounting & Platform Billing Engine
// ==============================================================================

import {
  FinancialTransaction,
  FinancialAccount,
  PlatformInvoice,
  PlatformPayment,
  InvoiceStatus,
} from '@dineflow/database';

export interface HotelFinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netOperatingResult: number;
  activeAccountsCount: number;
  totalCashBalance: number;
  totalBankBalance: number;
  transactionCount: number;
}

export interface PlatformBillingSummary {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  overdueCount: number;
  paidCount: number;
  unpaidCount: number;
  collectionRatePercent: number;
}

export class AccountingEngine {
  /**
   * Computes the net financial summary for a hotel from its transactions and accounts.
   * Formula: Net operating result = recorded income - recorded expenses.
   */
  static calculateHotelSummary(
    transactions: FinancialTransaction[],
    accounts: FinancialAccount[]
  ): HotelFinancialSummary {
    const validTransactions = transactions.filter((t) => !t.is_voided);

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of validTransactions) {
      if (tx.type === 'income') {
        totalIncome += Number(tx.amount);
      } else if (tx.type === 'expense') {
        totalExpenses += Number(tx.amount);
      }
    }

    const netOperatingResult = totalIncome - totalExpenses;

    let totalCashBalance = 0;
    let totalBankBalance = 0;

    for (const acc of accounts) {
      if (acc.is_active) {
        if (acc.account_type === 'cash') {
          totalCashBalance += Number(acc.current_balance);
        } else {
          totalBankBalance += Number(acc.current_balance);
        }
      }
    }

    return {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netOperatingResult: Number(netOperatingResult.toFixed(2)),
      activeAccountsCount: accounts.filter((a) => a.is_active).length,
      totalCashBalance: Number(totalCashBalance.toFixed(2)),
      totalBankBalance: Number(totalBankBalance.toFixed(2)),
      transactionCount: validTransactions.length,
    };
  }

  /**
   * Generates a unique sequential platform invoice number.
   * Example: INV-2026-0004
   */
  static generateInvoiceNumber(existingInvoicesCount: number): string {
    const year = new Date().getFullYear();
    const sequence = String(existingInvoicesCount + 1).padStart(4, '0');
    return `INV-${year}-${sequence}`;
  }

  /**
   * Calculates effective invoice status based on payment total and due date.
   */
  static computeInvoiceStatus(
    totalAmount: number,
    paidAmount: number,
    dueDate: string,
    currentStatus: InvoiceStatus
  ): InvoiceStatus {
    if (currentStatus === 'voided') return 'voided';
    if (paidAmount >= totalAmount && totalAmount > 0) return 'paid';
    if (paidAmount > 0 && paidAmount < totalAmount) return 'partially_paid';

    const dueTime = new Date(dueDate).getTime();
    const now = Date.now();
    if (dueTime < now) return 'overdue';

    return 'unpaid';
  }

  /**
   * Computes high-level platform billing metrics for the Super Admin dashboard.
   */
  static calculatePlatformBillingSummary(
    invoices: PlatformInvoice[]
  ): PlatformBillingSummary {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    for (const inv of invoices) {
      if (inv.status === 'voided') continue;

      totalInvoiced += Number(inv.total_amount);
      totalCollected += Number(inv.paid_amount || 0);

      const effectiveStatus = this.computeInvoiceStatus(
        Number(inv.total_amount),
        Number(inv.paid_amount || 0),
        inv.due_date,
        inv.status
      );

      if (effectiveStatus === 'paid') paidCount++;
      else if (effectiveStatus === 'overdue') overdueCount++;
      else unpaidCount++;
    }

    const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);
    const collectionRatePercent =
      totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 100;

    return {
      totalInvoiced: Number(totalInvoiced.toFixed(2)),
      totalCollected: Number(totalCollected.toFixed(2)),
      totalOutstanding: Number(totalOutstanding.toFixed(2)),
      overdueCount,
      paidCount,
      unpaidCount,
      collectionRatePercent,
    };
  }

  /**
   * Generates CSV string for financial transactions export.
   */
  static exportTransactionsToCsv(transactions: FinancialTransaction[]): string {
    const headers = [
      'Transaction ID',
      'Date',
      'Type',
      'Category',
      'Account',
      'Amount',
      'Description',
      'Payment Method',
      'Reference Number',
      'Is Voided',
      'Void Reason',
    ];

    const rows = transactions.map((t) => [
      t.id,
      t.transaction_date,
      t.type.toUpperCase(),
      t.category?.name || 'Uncategorized',
      t.account?.account_name || 'General',
      t.amount.toFixed(2),
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.payment_method,
      t.reference_number || '',
      t.is_voided ? 'YES' : 'NO',
      `"${(t.void_reason || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Generates CSV string for platform invoices export.
   */
  static exportInvoicesToCsv(invoices: PlatformInvoice[]): string {
    const headers = [
      'Invoice #',
      'Hotel',
      'Issue Date',
      'Due Date',
      'Subtotal',
      'Tax Amount',
      'Total Amount',
      'Paid Amount',
      'Status',
    ];

    const rows = invoices.map((inv) => [
      inv.invoice_number,
      `"${(inv.hotel?.name || 'Unknown Hotel').replace(/"/g, '""')}"`,
      inv.issue_date,
      inv.due_date,
      inv.subtotal.toFixed(2),
      inv.tax_amount.toFixed(2),
      inv.total_amount.toFixed(2),
      inv.paid_amount.toFixed(2),
      inv.status.toUpperCase(),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
