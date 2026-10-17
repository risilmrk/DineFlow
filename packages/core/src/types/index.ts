export type HotelStatus = 'active' | 'suspended' | 'pending' | 'archived';
export type SubscriptionStatus = 'active' | 'expired' | 'suspended' | 'canceled' | 'trial';
export type BillingCycle = 'monthly' | 'yearly' | 'lifetime' | 'custom';
export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'voided';
export type TransactionType = 'income' | 'expense';
export type AccountType = 'cash' | 'bank' | 'digital_wallet' | 'other';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface OperatingHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  [key: string]: string | undefined;
}

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  custom_domain?: string | null;
  status: HotelStatus;
  logo_url?: string | null;
  cover_image_url?: string | null;
  theme_color: string;
  tagline?: string | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  currency: string;
  currency_symbol: string;
  operating_hours: OperatingHours;
  social_links: Record<string, string>;
  custom_css?: string | null;
  custom_guest_page_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  created_at: string;
}

export interface PlatformRole {
  user_id: string;
  role: 'super_admin' | 'support' | 'auditor';
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  max_staff_accounts: number;
  max_food_items: number;
  max_menu_categories: number;
  cloudinary_storage_mb: number;
  api_access_enabled: boolean;
  monthly_api_quota: number;
  api_rate_limit_rpm: number;
  custom_guest_page_enabled: boolean;
  analytics_export_enabled: boolean;
  features: string[];
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface HotelSubscription {
  id: string;
  hotel_id: string;
  plan_id: string;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  start_date: string;
  expiry_date: string;
  assigned_by?: string | null;
  notes?: string | null;
  plan?: SubscriptionPlan;
  created_at: string;
  updated_at: string;
}

export interface HotelRole {
  id: string;
  hotel_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  is_system: boolean;
  permissions?: string[];
  created_at: string;
}

export interface Permission {
  id: string;
  category: string;
  description: string;
}

export interface HotelMembership {
  id: string;
  hotel_id: string;
  user_id: string;
  role_id: string;
  status: 'active' | 'inactive' | 'suspended';
  profile?: UserProfile;
  role?: HotelRole;
  created_at: string;
}

export interface StaffInvitation {
  id: string;
  hotel_id: string;
  email: string;
  role_id: string;
  invited_by: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  role?: HotelRole;
}

export interface MenuCategory {
  id: string;
  hotel_id: string;
  name: string;
  description?: string | null;
  slug: string;
  icon?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItem {
  id: string;
  hotel_id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  image_url?: string | null;
  image_public_id?: string | null;
  dietary_tags: string[];
  spicy_level: number;
  calories?: number | null;
  preparation_time_minutes?: number | null;
  allergens: string[];
  is_available: boolean;
  is_featured: boolean;
  is_chef_special: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  category?: MenuCategory;
}

export interface MediaAsset {
  id: string;
  hotel_id: string;
  public_id: string;
  url: string;
  secure_url: string;
  format?: string | null;
  bytes: number;
  width?: number | null;
  height?: number | null;
  asset_type: 'menu_item' | 'logo' | 'cover' | 'receipt' | 'general';
  uploaded_by?: string | null;
  created_at: string;
}

export interface ApiKey {
  id: string;
  hotel_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  last_used_at?: string | null;
  is_active: boolean;
  expires_at?: string | null;
  created_at: string;
}

export interface PlatformInvoice {
  id: string;
  hotel_id: string;
  subscription_id?: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  notes?: string | null;
  hotel?: Hotel;
  items?: PlatformInvoiceItem[];
  created_at: string;
}

export interface PlatformInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface PlatformPayment {
  id: string;
  invoice_id: string;
  hotel_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'bank_transfer' | 'wire' | 'credit_card_manual' | 'cash' | 'cheque' | 'other';
  reference_number?: string | null;
  notes?: string | null;
  recorded_by: string;
  created_at: string;
}

export interface FinancialAccount {
  id: string;
  hotel_id: string;
  account_name: string;
  account_type: AccountType;
  account_number_last4?: string | null;
  opening_balance: number;
  current_balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface AccountingCategory {
  id: string;
  hotel_id: string;
  type: TransactionType;
  name: string;
  description?: string | null;
  is_system: boolean;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  hotel_id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  description: string;
  payment_method: string;
  reference_number?: string | null;
  receipt_url?: string | null;
  is_voided: boolean;
  void_reason?: string | null;
  voided_at?: string | null;
  created_at: string;
  account?: FinancialAccount;
  category?: AccountingCategory;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  currentCount: number;
  maxLimit: number;
  remaining: number;
  percentageUsed: number;
  message?: string;
}
