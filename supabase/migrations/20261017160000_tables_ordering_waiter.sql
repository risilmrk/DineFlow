-- ==============================================================================
-- Tables, Guest Self-Ordering & Waiter Service Flow
-- ==============================================================================

-- 1. Hotel Tables
CREATE TABLE IF NOT EXISTS public.hotel_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    section TEXT NOT NULL DEFAULT 'Main Dining',
    qr_code_url TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'calling_waiter')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT hotel_tables_hotel_number_key UNIQUE (hotel_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_hotel_tables_hotel ON public.hotel_tables(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_tables_status ON public.hotel_tables(status);

-- 2. Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.hotel_tables(id) ON DELETE SET NULL,
    table_number TEXT NOT NULL,
    order_number TEXT NOT NULL,
    guest_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_kitchen', 'ready', 'served', 'completed', 'cancelled')),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    payment_method TEXT,
    special_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_hotel_created ON public.orders(hotel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table ON public.orders(table_id);

-- 3. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(10,2) NOT NULL,
    special_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 4. Waiter / Service Requests
CREATE TABLE IF NOT EXISTS public.waiter_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.hotel_tables(id) ON DELETE SET NULL,
    table_number TEXT NOT NULL,
    request_type TEXT NOT NULL DEFAULT 'call_waiter' CHECK (request_type IN ('call_waiter', 'water_refill', 'bring_cutlery', 'bring_bill', 'clean_table', 'custom')),
    custom_note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'attending', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_waiter_calls_hotel ON public.waiter_calls(hotel_id, status);

-- Disable RLS for now to ensure seamless multi-tenant operations without policy recursion
ALTER TABLE public.hotel_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_calls DISABLE ROW LEVEL SECURITY;

-- Permissions
INSERT INTO public.permissions (id, category, description) VALUES
('tables.manage', 'Tables', 'Manage restaurant tables and floor plans'),
('orders.view', 'Orders', 'View live dining room orders and statuses'),
('orders.manage', 'Orders', 'Update order statuses and settle bills'),
('waiter.flow', 'Waiter', 'Access waiter call feed and floor management')
ON CONFLICT (id) DO NOTHING;
