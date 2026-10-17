import { describe, it, expect } from 'vitest';
import {
  EntitlementService,
  AccountingEngine,
  resolveTenant,
  buildHotelGuestUrl,
} from '../packages/core/src';
import { SubscriptionPlan, HotelSubscription, FinancialTransaction, FinancialAccount } from '../packages/database/src';

describe('EntitlementService', () => {
  const mockPlan: SubscriptionPlan = {
    id: 'plan_pro',
    name: 'Pro Culinary',
    slug: 'pro',
    monthly_price: 79,
    yearly_price: 790,
    currency: 'USD',
    is_active: true,
    is_featured: true,
    max_staff_accounts: 10,
    max_food_items: 120,
    max_menu_categories: 25,
    cloudinary_storage_mb: 500,
    api_access_enabled: true,
    monthly_api_quota: 50000,
    api_rate_limit_rpm: 120,
    custom_guest_page_enabled: true,
    analytics_export_enabled: true,
    features: ['API Access'],
    sort_order: 2,
  };

  const mockSub: HotelSubscription = {
    id: 'sub_1',
    hotel_id: 'hotel_1',
    plan_id: 'plan_pro',
    billing_cycle: 'monthly',
    status: 'active',
    start_date: '2026-01-01T00:00:00Z',
    expiry_date: '2026-12-31T23:59:59Z',
    plan: mockPlan,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('allows adding dishes when below capacity', () => {
    const result = EntitlementService.checkFoodItemsQuota(40, mockSub);
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(40);
    expect(result.remaining).toBe(80);
    expect(result.maxLimit).toBe(120);
  });

  it('blocks adding dishes when limit is reached', () => {
    const result = EntitlementService.checkFoodItemsQuota(120, mockSub);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.message).toContain('Food items limit reached');
  });

  it('counts pending invitations in staff quota to avoid overallocation', () => {
    // 8 active staff + 2 pending invites = 10 (max limit)
    const result = EntitlementService.checkStaffQuota(8, 2, mockSub);
    expect(result.allowed).toBe(false);
    expect(result.currentCount).toBe(10);
    expect(result.remaining).toBe(0);
  });
});

describe('AccountingEngine', () => {
  const accounts: FinancialAccount[] = [
    {
      id: 'acc_cash',
      hotel_id: 'hotel_1',
      account_name: 'Main Drawer Cash',
      account_type: 'cash',
      opening_balance: 0,
      current_balance: 1500,
      currency: 'USD',
      is_active: true,
      created_at: '2026-01-01',
    },
    {
      id: 'acc_bank',
      hotel_id: 'hotel_1',
      account_name: 'Operating Bank Account',
      account_type: 'bank',
      opening_balance: 0,
      current_balance: 8500,
      currency: 'USD',
      is_active: true,
      created_at: '2026-01-01',
    },
  ];

  const transactions: FinancialTransaction[] = [
    {
      id: 'tx_1',
      hotel_id: 'hotel_1',
      account_id: 'acc_cash',
      category_id: 'cat_rev',
      type: 'income',
      amount: 1200,
      transaction_date: '2026-10-15',
      description: 'Dinner Service Revenue',
      payment_method: 'cash',
      is_voided: false,
      created_at: '2026-10-15',
    },
    {
      id: 'tx_2',
      hotel_id: 'hotel_1',
      account_id: 'acc_bank',
      category_id: 'cat_rev',
      type: 'income',
      amount: 2800,
      transaction_date: '2026-10-16',
      description: 'POS Terminal Settlements',
      payment_method: 'pos_card',
      is_voided: false,
      created_at: '2026-10-16',
    },
    {
      id: 'tx_3',
      hotel_id: 'hotel_1',
      account_id: 'acc_bank',
      category_id: 'cat_exp',
      type: 'expense',
      amount: 1500,
      transaction_date: '2026-10-16',
      description: 'Seafood & Produce Supply',
      payment_method: 'bank_transfer',
      is_voided: false,
      created_at: '2026-10-16',
    },
    {
      id: 'tx_4_voided',
      hotel_id: 'hotel_1',
      account_id: 'acc_cash',
      category_id: 'cat_exp',
      type: 'expense',
      amount: 9999,
      transaction_date: '2026-10-16',
      description: 'Mistaken Cash Entry',
      payment_method: 'cash',
      is_voided: true,
      void_reason: 'Duplicate entry error by cashier',
      created_at: '2026-10-16',
    },
  ];

  it('correctly calculates Net Operating Result = Income - Expenses while ignoring voided transactions', () => {
    const summary = AccountingEngine.calculateHotelSummary(transactions, accounts);

    // Total income = 1200 + 2800 = 4000
    expect(summary.totalIncome).toBe(4000);
    // Total expenses = 1500 (the 9999 is voided and must NOT be counted)
    expect(summary.totalExpenses).toBe(1500);
    // Net result = 4000 - 1500 = 2500
    expect(summary.netOperatingResult).toBe(2500);

    // Liquid balances
    expect(summary.totalCashBalance).toBe(1500);
    expect(summary.totalBankBalance).toBe(8500);
  });
});

describe('TenantResolver', () => {
  it('resolves hotel guest panel from local subdomain', () => {
    const info = resolveTenant('gusto.localhost', '/', '');
    expect(info.panel).toBe('guest');
    expect(info.hotelSlug).toBe('gusto');
    expect(info.isSubdomain).toBe(true);
  });

  it('resolves super admin from admin subdomain', () => {
    const info = resolveTenant('admin.localhost', '/', '');
    expect(info.panel).toBe('super_admin');
    expect(info.isReservedAdmin).toBe(true);
  });

  it('resolves super admin from query param', () => {
    const info = resolveTenant('localhost', '/', '?panel=superadmin');
    expect(info.panel).toBe('super_admin');
  });

  it('builds canonical local subdomain guest URL', () => {
    const url = buildHotelGuestUrl('gusto', '5173');
    expect(url).toBe('http://gusto.localhost:5173');
  });
});
