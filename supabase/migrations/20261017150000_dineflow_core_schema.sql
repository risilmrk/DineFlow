-- ==============================================================================
-- DineFlow Multi-Tenant Hotel Digital Menu SaaS Schema Migration
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Handle new auth user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- 2. Platform Roles (Super Admin, Support, Auditor)
CREATE TABLE IF NOT EXISTS public.platform_roles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'support', 'auditor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    yearly_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    max_staff_accounts INTEGER NOT NULL DEFAULT 3,
    max_food_items INTEGER NOT NULL DEFAULT 30,
    max_menu_categories INTEGER NOT NULL DEFAULT 5,
    cloudinary_storage_mb INTEGER NOT NULL DEFAULT 100,
    api_access_enabled BOOLEAN NOT NULL DEFAULT false,
    monthly_api_quota INTEGER NOT NULL DEFAULT 1000,
    api_rate_limit_rpm INTEGER NOT NULL DEFAULT 60,
    custom_guest_page_enabled BOOLEAN NOT NULL DEFAULT false,
    analytics_export_enabled BOOLEAN NOT NULL DEFAULT false,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Hotels (Tenants)
CREATE TABLE IF NOT EXISTS public.hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    custom_domain TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'archived')),
    logo_url TEXT,
    cover_image_url TEXT,
    theme_color TEXT NOT NULL DEFAULT '#ea580c',
    tagline TEXT,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    operating_hours JSONB NOT NULL DEFAULT '{"monday":"09:00 - 22:00","tuesday":"09:00 - 22:00","wednesday":"09:00 - 22:00","thursday":"09:00 - 22:00","friday":"09:00 - 23:00","saturday":"10:00 - 23:00","sunday":"10:00 - 21:00"}'::jsonb,
    social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
    custom_css TEXT,
    custom_guest_page_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Hotel Roles (Global system roles or custom per hotel)
CREATE TABLE IF NOT EXISTS public.hotel_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hotel_id, slug)
);

-- 6. Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL
);

-- 7. Role-Permission Mappings
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.hotel_roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 8. Hotel Memberships
CREATE TABLE IF NOT EXISTS public.hotel_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.hotel_roles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hotel_id, user_id)
);

-- 9. Staff Invitations
CREATE TABLE IF NOT EXISTS public.staff_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES public.hotel_roles(id) ON DELETE RESTRICT,
    invited_by UUID NOT NULL REFERENCES public.profiles(id),
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Hotel Subscriptions
CREATE TABLE IF NOT EXISTS public.hotel_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID UNIQUE NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime', 'custom')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'canceled', 'trial')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    expiry_date TIMESTAMPTZ NOT NULL,
    assigned_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Subscription History
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    action TEXT NOT NULL,
    previous_plan_id UUID REFERENCES public.subscription_plans(id),
    start_date TIMESTAMPTZ NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    performed_by UUID REFERENCES public.profiles(id),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Menu Categories
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hotel_id, slug)
);

-- 13. Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(10,2) CHECK (compare_at_price >= 0),
    image_url TEXT,
    image_public_id TEXT,
    dietary_tags TEXT[] NOT NULL DEFAULT '{}',
    spicy_level INTEGER NOT NULL DEFAULT 0 CHECK (spicy_level BETWEEN 0 AND 3),
    calories INTEGER,
    preparation_time_minutes INTEGER,
    allergens TEXT[] NOT NULL DEFAULT '{}',
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_chef_special BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hotel_id, slug)
);

-- 14. Media Assets (Cloudinary Tracking)
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    public_id TEXT NOT NULL,
    url TEXT NOT NULL,
    secure_url TEXT NOT NULL,
    format TEXT,
    bytes INTEGER NOT NULL DEFAULT 0,
    width INTEGER,
    height INTEGER,
    asset_type TEXT NOT NULL DEFAULT 'menu_item' CHECK (asset_type IN ('menu_item', 'logo', 'cover', 'receipt', 'general')),
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES public.profiles(id),
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. API Usage Logs
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES public.api_keys(id),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('menu_view', 'category_view', 'item_view', 'qr_scan', 'share', 'filter_click')),
    category_id UUID REFERENCES public.menu_categories(id),
    menu_item_id UUID REFERENCES public.menu_items(id),
    source TEXT DEFAULT 'direct',
    device_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. Analytics Daily Aggregates
CREATE TABLE IF NOT EXISTS public.analytics_daily_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_visits INTEGER NOT NULL DEFAULT 0,
    unique_sessions INTEGER NOT NULL DEFAULT 0,
    item_views INTEGER NOT NULL DEFAULT 0,
    qr_scans INTEGER NOT NULL DEFAULT 0,
    api_requests INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (hotel_id, date)
);

-- 19. Platform Invoices (Super Admin Billing)
CREATE TABLE IF NOT EXISTS public.platform_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE RESTRICT,
    subscription_id UUID REFERENCES public.hotel_subscriptions(id),
    invoice_number TEXT UNIQUE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'overdue', 'voided')),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. Platform Invoice Items
CREATE TABLE IF NOT EXISTS public.platform_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.platform_invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00
);

-- 21. Platform Payments
CREATE TABLE IF NOT EXISTS public.platform_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.platform_invoices(id) ON DELETE RESTRICT,
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE RESTRICT,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'wire', 'credit_card_manual', 'cash', 'cheque', 'other')),
    reference_number TEXT,
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. Hotel Financial Accounts (Internal Accounting)
CREATE TABLE IF NOT EXISTS public.hotel_financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('cash', 'bank', 'digital_wallet', 'other')),
    account_number_last4 TEXT,
    opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. Hotel Accounting Categories
CREATE TABLE IF NOT EXISTS public.hotel_accounting_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 24. Hotel Financial Transactions
CREATE TABLE IF NOT EXISTS public.hotel_financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.hotel_financial_accounts(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.hotel_accounting_categories(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'cheque', 'upi', 'other')),
    reference_number TEXT,
    receipt_url TEXT,
    is_voided BOOLEAN NOT NULL DEFAULT false,
    void_reason TEXT,
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES public.profiles(id),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 25. Hotel Account Transfers
CREATE TABLE IF NOT EXISTS public.hotel_account_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL REFERENCES public.hotel_financial_accounts(id),
    to_account_id UUID NOT NULL REFERENCES public.hotel_financial_accounts(id),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    reference_number TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 26. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_hotels_slug ON public.hotels(slug);
CREATE INDEX IF NOT EXISTS idx_hotel_memberships_user ON public.hotel_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_memberships_hotel ON public.hotel_memberships(hotel_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_hotel ON public.menu_categories(hotel_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_hotel ON public.menu_items(hotel_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_hotel ON public.media_assets(hotel_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hotel ON public.api_keys(hotel_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_hotel ON public.api_usage_logs(hotel_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_hotel ON public.analytics_events(hotel_id);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_hotel ON public.platform_invoices(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_transactions_hotel ON public.hotel_financial_transactions(hotel_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_accounting_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_account_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.platform_roles
        WHERE user_id = check_user_id AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_hotel_permission(check_hotel_id UUID, check_user_id UUID, req_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_super_admin(check_user_id) THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.hotel_memberships m
        JOIN public.role_permissions rp ON rp.role_id = m.role_id
        WHERE m.hotel_id = check_hotel_id
          AND m.user_id = check_user_id
          AND m.status = 'active'
          AND rp.permission_id = req_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles: users read their own, super admins read all, hotel members can read fellow hotel staff
CREATE POLICY profiles_read ON public.profiles FOR SELECT USING (
    auth.uid() = id OR public.is_super_admin(auth.uid()) OR EXISTS (
        SELECT 1 FROM public.hotel_memberships m1
        JOIN public.hotel_memberships m2 ON m1.hotel_id = m2.hotel_id
        WHERE m1.user_id = auth.uid() AND m2.user_id = public.profiles.id
    )
);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Subscription plans: public read active plans, super admin full manage
CREATE POLICY plans_read ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY plans_manage ON public.subscription_plans FOR ALL USING (public.is_super_admin(auth.uid()));

-- Hotels: Public can read active hotel branding
CREATE POLICY hotels_public_read ON public.hotels FOR SELECT USING (
    status = 'active' OR public.is_super_admin(auth.uid()) OR EXISTS (
        SELECT 1 FROM public.hotel_memberships WHERE hotel_id = public.hotels.id AND user_id = auth.uid()
    )
);
CREATE POLICY hotels_super_admin ON public.hotels FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY hotels_hotel_admin_update ON public.hotels FOR UPDATE USING (
    public.has_hotel_permission(id, auth.uid(), 'settings.manage')
);

-- Hotel memberships: super admin all, hotel staff view fellow members
CREATE POLICY memberships_read ON public.hotel_memberships FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR hotel_id IN (
        SELECT hotel_id FROM public.hotel_memberships WHERE user_id = auth.uid()
    )
);
CREATE POLICY memberships_manage ON public.hotel_memberships FOR ALL USING (
    public.is_super_admin(auth.uid()) OR public.has_hotel_permission(hotel_id, auth.uid(), 'staff.manage')
);

-- Menu Categories: Public read active categories of active hotel
CREATE POLICY categories_public_read ON public.menu_categories FOR SELECT USING (
    is_active = true OR public.has_hotel_permission(hotel_id, auth.uid(), 'menu.view')
);
CREATE POLICY categories_manage ON public.menu_categories FOR ALL USING (
    public.has_hotel_permission(hotel_id, auth.uid(), 'categories.manage')
);

-- Menu Items: Public read available items
CREATE POLICY menu_items_public_read ON public.menu_items FOR SELECT USING (
    is_available = true OR public.has_hotel_permission(hotel_id, auth.uid(), 'menu.view')
);
CREATE POLICY menu_items_manage ON public.menu_items FOR ALL USING (
    public.has_hotel_permission(hotel_id, auth.uid(), 'menu.manage')
);

-- Financial Accounts: scoped to hotel with accounting permission
CREATE POLICY accounts_read ON public.hotel_financial_accounts FOR SELECT USING (
    public.has_hotel_permission(hotel_id, auth.uid(), 'accounting.view')
);
CREATE POLICY accounts_manage ON public.hotel_financial_accounts FOR ALL USING (
    public.has_hotel_permission(hotel_id, auth.uid(), 'accounting.transactions.create')
);

-- Financial Transactions
CREATE POLICY transactions_read ON public.hotel_financial_transactions FOR SELECT USING (
    public.has_hotel_permission(hotel_id, auth.uid(), 'accounting.view')
);
CREATE POLICY transactions_insert ON public.hotel_financial_transactions FOR INSERT WITH CHECK (
    public.has_hotel_permission(hotel_id, auth.uid(), 'accounting.transactions.create')
);
CREATE POLICY transactions_update ON public.hotel_financial_transactions FOR UPDATE USING (
    public.has_hotel_permission(hotel_id, auth.uid(), 'accounting.transactions.edit')
);

-- Platform Invoices & Payments: Super Admin manage, Hotel view own invoices
CREATE POLICY invoices_read ON public.platform_invoices FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR public.has_hotel_permission(hotel_id, auth.uid(), 'billing.view')
);
CREATE POLICY invoices_super_admin ON public.platform_invoices FOR ALL USING (
    public.is_super_admin(auth.uid())
);
CREATE POLICY payments_read ON public.platform_payments FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR public.has_hotel_permission(hotel_id, auth.uid(), 'billing.view')
);
CREATE POLICY payments_super_admin ON public.platform_payments FOR ALL USING (
    public.is_super_admin(auth.uid())
);

-- Audit logs: Super Admin can read all, Hotel staff can read hotel logs
CREATE POLICY audit_logs_read ON public.audit_logs FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR (
        hotel_id IS NOT NULL AND public.has_hotel_permission(hotel_id, auth.uid(), 'analytics.view')
    )
);
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT WITH CHECK (true);
