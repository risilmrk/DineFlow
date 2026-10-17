-- ==============================================================================
-- DineFlow Production Seed Data: Multi-Tenant Hotel Digital Menu SaaS
-- Includes: Plans, Roles, Permissions, Hotels (Royal, Gusto, Malabar, Paradise, Bella Vista),
-- Menu Categories, Dishes, Financial Accounts, Accounting Categories, Transactions,
-- Platform Invoices, Line Items, Platform Payments, and API Keys.
-- ==============================================================================

-- 1. Insert Standard Permissions
INSERT INTO public.permissions (id, category, description) VALUES
('menu.view', 'Menu', 'View menu categories and dishes'),
('menu.manage', 'Menu', 'Create, update, and delete menu items'),
('categories.manage', 'Menu', 'Create, reorder, and manage categories'),
('staff.invite', 'Staff', 'Invite new staff members to the hotel'),
('staff.manage', 'Staff', 'Manage staff roles and remove members'),
('roles.manage', 'Staff', 'Create and modify custom hotel roles'),
('settings.manage', 'Settings', 'Update hotel profile, branding, and domains'),
('analytics.view', 'Analytics', 'View guest traffic, popular items, and metrics'),
('analytics.export', 'Analytics', 'Export analytics reports to CSV/PDF'),
('api_keys.manage', 'API', 'Create, rotate, and revoke hotel REST API keys'),
('storage.manage', 'Storage', 'Upload, replace, and delete Cloudinary media'),
('billing.view', 'Billing', 'View hotel subscription details and platform invoices'),
('billing.manage', 'Billing', 'Manage hotel subscription renewal and plan requests'),
('invoices.view', 'Accounting', 'View issued platform invoices'),
('invoices.manage', 'Accounting', 'Create and manage platform invoices (Super Admin)'),
('payments.view', 'Accounting', 'View recorded payments'),
('payments.record', 'Accounting', 'Record manual payments against invoices'),
('accounting.view', 'Accounting', 'View hotel income, expenses, and cash/bank balances'),
('accounting.transactions.create', 'Accounting', 'Record new income and expense entries'),
('accounting.transactions.edit', 'Accounting', 'Modify and update accounting entries'),
('accounting.transactions.void', 'Accounting', 'Void accounting transactions with audit reason'),
('accounting.reports.export', 'Accounting', 'Export hotel financial reports and CSVs')
ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description;

-- 2. System Default Roles (hotel_id is NULL for platform templates)
INSERT INTO public.hotel_roles (id, hotel_id, name, slug, description, is_system) VALUES
('11111111-1111-1111-1111-111111111101', NULL, 'Hotel Owner', 'owner', 'Full control over hotel profile, staff, menu, accounting, and billing', true),
('11111111-1111-1111-1111-111111111102', NULL, 'Hotel Administrator', 'admin', 'Manage menu, staff invitations, daily accounting, and operational settings', true),
('11111111-1111-1111-1111-111111111103', NULL, 'Operations Manager', 'manager', 'Manage menu items, view analytics, and record operational expenses', true),
('11111111-1111-1111-1111-111111111104', NULL, 'Menu Editor', 'editor', 'Create, edit, and update menu categories, dishes, and photos', true),
('11111111-1111-1111-1111-111111111105', NULL, 'Financial Analyst', 'analyst', 'View analytics, income/expense reports, and export financial data', true)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions to Owner (All Permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111101', id FROM public.permissions
ON CONFLICT DO NOTHING;

-- Grant permissions to Admin
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('11111111-1111-1111-1111-111111111102', 'menu.view'),
('11111111-1111-1111-1111-111111111102', 'menu.manage'),
('11111111-1111-1111-1111-111111111102', 'categories.manage'),
('11111111-1111-1111-1111-111111111102', 'staff.invite'),
('11111111-1111-1111-1111-111111111102', 'settings.manage'),
('11111111-1111-1111-1111-111111111102', 'analytics.view'),
('11111111-1111-1111-1111-111111111102', 'storage.manage'),
('11111111-1111-1111-1111-111111111102', 'billing.view'),
('11111111-1111-1111-1111-111111111102', 'accounting.view'),
('11111111-1111-1111-1111-111111111102', 'accounting.transactions.create')
ON CONFLICT DO NOTHING;

-- Grant permissions to Manager
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('11111111-1111-1111-1111-111111111103', 'menu.view'),
('11111111-1111-1111-1111-111111111103', 'menu.manage'),
('11111111-1111-1111-1111-111111111103', 'categories.manage'),
('11111111-1111-1111-1111-111111111103', 'analytics.view'),
('11111111-1111-1111-1111-111111111103', 'accounting.view'),
('11111111-1111-1111-1111-111111111103', 'accounting.transactions.create')
ON CONFLICT DO NOTHING;

-- Grant permissions to Editor
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('11111111-1111-1111-1111-111111111104', 'menu.view'),
('11111111-1111-1111-1111-111111111104', 'menu.manage'),
('11111111-1111-1111-1111-111111111104', 'categories.manage'),
('11111111-1111-1111-1111-111111111104', 'storage.manage')
ON CONFLICT DO NOTHING;

-- Grant permissions to Analyst
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('11111111-1111-1111-1111-111111111105', 'menu.view'),
('11111111-1111-1111-1111-111111111105', 'analytics.view'),
('11111111-1111-1111-1111-111111111105', 'analytics.export'),
('11111111-1111-1111-1111-111111111105', 'accounting.view'),
('11111111-1111-1111-1111-111111111105', 'accounting.reports.export')
ON CONFLICT DO NOTHING;

-- 3. Subscription Plans
INSERT INTO public.subscription_plans (
    id, name, slug, description, monthly_price, yearly_price, currency,
    is_active, is_featured, max_staff_accounts, max_food_items, max_menu_categories,
    cloudinary_storage_mb, api_access_enabled, monthly_api_quota, api_rate_limit_rpm,
    custom_guest_page_enabled, analytics_export_enabled, features, sort_order
) VALUES
(
    '22222222-2222-2222-2222-222222222201',
    'Base Starter',
    'base',
    'Essential digital menu for intimate cafes, bistros, and boutique diners.',
    29.00,
    290.00,
    'USD',
    true,
    false,
    3,
    35,
    6,
    150,
    false,
    0,
    0,
    false,
    false,
    '["QR Code Menu Generator", "Mobile-Optimized Guest View", "Dietary & Allergen Badges", "Basic Internal Accounting", "Standard Email Support"]'::jsonb,
    1
),
(
    '22222222-2222-2222-2222-222222222202',
    'Pro Culinary',
    'pro',
    'Comprehensive powerhouse for high-volume restaurants, bistros, and gastropubs.',
    79.00,
    790.00,
    'USD',
    true,
    true,
    10,
    150,
    18,
    600,
    true,
    10000,
    60,
    true,
    true,
    '["Everything in Base Starter", "Up to 10 Staff Roles & Granular Permissions", "High-Resolution Cloudinary Storage (600 MB)", "REST API Access (10k req/mo)", "Custom Guest Page Embedding", "Full Internal Accounting & PDF Invoicing", "Priority Support"]'::jsonb,
    2
),
(
    '22222222-2222-2222-2222-222222222203',
    'Enterprise Grand',
    'enterprise',
    'Ultimate hospitality suite for luxury hotels, multi-outlet chains, and resorts.',
    199.00,
    1990.00,
    'USD',
    true,
    false,
    50,
    600,
    50,
    2500,
    true,
    100000,
    300,
    true,
    true,
    '["Everything in Pro Culinary", "50 Staff Accounts & Unlimited Custom Roles", "2.5 GB Cloudinary Storage", "High-throughput REST API (100k req/mo)", "Multi-account Cash & Bank Ledger", "Dedicated Account Manager & 99.9% SLA", "Custom Domain & White-label Options"]'::jsonb,
    3
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    max_staff_accounts = EXCLUDED.max_staff_accounts,
    max_food_items = EXCLUDED.max_food_items,
    max_menu_categories = EXCLUDED.max_menu_categories,
    cloudinary_storage_mb = EXCLUDED.cloudinary_storage_mb,
    api_access_enabled = EXCLUDED.api_access_enabled,
    monthly_api_quota = EXCLUDED.monthly_api_quota,
    features = EXCLUDED.features;

-- 4. Seed Hotels (Royal, Gusto, Malabar, Paradise, Bella Vista)
INSERT INTO public.hotels (
    id, name, slug, custom_domain, status, logo_url, cover_image_url,
    theme_color, tagline, description, address, phone, email, currency, currency_symbol,
    operating_hours, social_links
) VALUES
(
    '20d386bd-2cdd-4157-8ecf-afa847957769',
    'The Royal Palm Palace & Dining',
    'royal',
    'menu.royalpalm.com',
    'active',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1600&h=600&fit=crop',
    '#d97706',
    'Haute Cuisine & Epicurean Excellence',
    'A sanctuary of culinary craftsmanship. Featuring Miyazaki A5 Wagyu, Brittany blue lobster, Imperial Oscietra caviar, and a curated cellar of vintage grand crus.',
    '740 Ocean Drive, Penthouse Promenade, Miami Beach, FL 33139',
    '+1 (305) 555-9000',
    'concierge@royalpalmdine.com',
    'USD',
    '$',
    '{"monday":"17:00 - 23:30","tuesday":"17:00 - 23:30","wednesday":"17:00 - 23:30","thursday":"17:00 - 00:00","friday":"17:00 - 01:00","saturday":"16:00 - 01:00","sunday":"16:00 - 23:00"}'::jsonb,
    '{"instagram":"@royalpalmdining","facebook":"theroyalpalmdine"}'::jsonb
),
(
    '33333333-3333-3333-3333-333333333301',
    'Gusto Italian Bistro',
    'gusto',
    'menu.gustobistro.com',
    'active',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&h=600&fit=crop',
    '#ea580c',
    'Woodfired Artistry & Handcrafted Pasta',
    'A contemporary Italian trattoria celebrating rustic Tuscan traditions, hand-rolled pastas, artisanal Neapolitan pizzas, and curated cellar wines.',
    '442 Via Roma, Little Italy, New York, NY 10013',
    '+1 (212) 555-4878',
    'ciao@gustobistro.com',
    'USD',
    '$',
    '{"monday":"11:30 - 22:30","tuesday":"11:30 - 22:30","wednesday":"11:30 - 22:30","thursday":"11:30 - 23:00","friday":"11:30 - 23:30","saturday":"10:30 - 23:30","sunday":"10:30 - 22:00"}'::jsonb,
    '{"instagram":"@gustobistro_ny","facebook":"gustoitalianbistro"}'::jsonb
),
(
    '33333333-3333-3333-3333-333333333302',
    'Malabar Coastal Kitchen',
    'malabar',
    'dine.malabarcoastal.com',
    'active',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1600&h=600&fit=crop',
    '#0d9488',
    'Authentic Coastal Seafood & Fragrant Spices',
    'Showcasing the vibrant coastal heritage of the Malabar coast, fragrant spice gardens, clay-pot curries, and freshly hauled ocean seafood.',
    '88 Marine Boulevard, Harborfront, San Francisco, CA 94111',
    '+1 (415) 555-6252',
    'reservations@malabarcoastal.com',
    'USD',
    '$',
    '{"monday":"12:00 - 22:00","tuesday":"12:00 - 22:00","wednesday":"12:00 - 22:00","thursday":"12:00 - 22:30","friday":"12:00 - 23:00","saturday":"11:00 - 23:00","sunday":"11:00 - 21:30"}'::jsonb,
    '{"instagram":"@malabarcoastal","website":"malabarcoastal.com"}'::jsonb
),
(
    '33333333-3333-3333-3333-333333333303',
    'Paradise Grill & Lounge',
    'paradise',
    'menu.paradisegrill.com',
    'active',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1508253578933-20b529302151?w=1600&h=600&fit=crop',
    '#8b5cf6',
    'Rooftop Steaks, Craft Mixology & Panoramic Views',
    'Perched atop the skyline, Paradise Grill pairs dry-aged prime steaks with inventive cocktail mixology and panoramic sunset lounges.',
    '700 Ocean Drive, Penthouse 24, Miami Beach, FL 33139',
    '+1 (305) 555-7744',
    'host@paradisegrill.com',
    'USD',
    '$',
    '{"monday":"17:00 - 01:00","tuesday":"17:00 - 01:00","wednesday":"17:00 - 01:00","thursday":"17:00 - 02:00","friday":"16:00 - 03:00","saturday":"16:00 - 03:00","sunday":"16:00 - 00:00"}'::jsonb,
    '{"instagram":"@paradiseradiance"}'::jsonb
),
(
    'ec035730-2e7d-4ca9-bf40-492618c90e5b',
    'Bella Vista Ristorante',
    'bellavista',
    'menu.bellavista.com',
    'active',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&h=600&fit=crop',
    '#f97316',
    'Artisan Tuscan Trattoria & Napa Vineyard Cellar',
    'Artisanal Tuscan trattoria with panoramic hillside vineyard views, serving handmade gnocchi, Fiorentina steaks, and Chianti Classico.',
    '140 Vineyard Way, Napa Valley, CA 94558',
    '+1 (707) 555-7123',
    'info@bellavistanapa.com',
    'USD',
    '$',
    '{"monday":"12:00 - 22:00","tuesday":"12:00 - 22:00","wednesday":"12:00 - 22:00","thursday":"12:00 - 22:30","friday":"12:00 - 23:30","saturday":"11:00 - 23:30","sunday":"11:00 - 21:30"}'::jsonb,
    '{"instagram":"@bellavistanapa"}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    logo_url = EXCLUDED.logo_url,
    cover_image_url = EXCLUDED.cover_image_url,
    theme_color = EXCLUDED.theme_color;

-- 5. Subscriptions for Hotels
INSERT INTO public.hotel_subscriptions (
    id, hotel_id, plan_id, billing_cycle, status, start_date, expiry_date, notes
) VALUES
(
    '3352fb12-b67f-4c72-8059-6298ea30e827',
    '20d386bd-2cdd-4157-8ecf-afa847957769',
    '22222222-2222-2222-2222-222222222203', -- Royal on Enterprise Grand
    'yearly',
    'active',
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '350 days',
    'Enterprise VIP account with dedicated support and white-labeling'
),
(
    '44444444-4444-4444-4444-444444444401',
    '33333333-3333-3333-3333-333333333301',
    '22222222-2222-2222-2222-222222222202', -- Gusto on Pro Culinary
    'monthly',
    'active',
    now() - INTERVAL '45 days',
    now() + INTERVAL '320 days',
    'Standard Pro plan with annual commitment'
),
(
    '44444444-4444-4444-4444-444444444402',
    '33333333-3333-3333-3333-333333333302',
    '22222222-2222-2222-2222-222222222203', -- Malabar on Enterprise Grand
    'yearly',
    'active',
    now() - INTERVAL '90 days',
    now() + INTERVAL '275 days',
    'Enterprise tier VIP client'
),
(
    '44444444-4444-4444-4444-444444444403',
    '33333333-3333-3333-3333-333333333303',
    '22222222-2222-2222-2222-222222222201', -- Paradise on Base Starter
    'monthly',
    'active',
    now() - INTERVAL '15 days',
    now() + INTERVAL '15 days',
    'Starter plan renewal upcoming'
)
ON CONFLICT (hotel_id) DO NOTHING;

-- 6. Menu Categories for All Hotels
-- Royal Categories
INSERT INTO public.menu_categories (id, hotel_id, name, slug, description, sort_order, is_active) VALUES
('20d386bd-2cdd-4157-8ecf-afa847957771', '20d386bd-2cdd-4157-8ecf-afa847957769', 'Starters & Caviar Service', 'starters-caviar', 'Petrossian & Imperial caviar service, chilled oysters, and artisan amuse-bouches', 1, true),
('5c34b3db-3b32-4a93-96a9-54c761f2e2d1', '20d386bd-2cdd-4157-8ecf-afa847957769', 'Chef Specials', 'specials', 'Masterful epicurean compositions handcrafted by Executive Chef', 2, true),
('49ac670c-2795-4acf-b39c-071c56cc88e1', '20d386bd-2cdd-4157-8ecf-afa847957769', 'Main Courses', 'mains', 'A5 Wagyu cuts, Brittany blue lobster, and pan-roasted sea bass', 3, true),
('e4008225-798e-4286-a8eb-c8e0b42268f1', '20d386bd-2cdd-4157-8ecf-afa847957769', 'Beverages', 'beverages', 'Vintage grand crus, Dom Pérignon, and barrel-aged cocktails', 4, true),
('20d386bd-2cdd-4157-8ecf-afa847957772', '20d386bd-2cdd-4157-8ecf-afa847957769', 'Decadent Desserts', 'desserts', 'Artisanal soufflés, single-origin chocolate creations, and gold-leaf patisserie', 5, true)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- Gusto Categories
INSERT INTO public.menu_categories (id, hotel_id, name, slug, description, icon, sort_order, is_active) VALUES
('55555555-5555-5555-5555-555555555101', '33333333-3333-3333-3333-333333333301', 'Antipasti & Starters', 'antipasti', 'Small sharing plates, artisan breads, and cured Italian delicacies', 'utensils', 1, true),
('55555555-5555-5555-5555-555555555102', '33333333-3333-3333-3333-333333333301', 'Handmade Fresh Pastas', 'primi-pastas', 'Extruded and hand-rolled pastas made fresh in-house every morning', 'wheat', 2, true),
('55555555-5555-5555-5555-555555555103', '33333333-3333-3333-3333-333333333301', 'Woodfired Pizzas', 'woodfired-pizzas', '48-hour fermented sourdough baked in our 900°F Marra Forni oven', 'flame', 3, true),
('55555555-5555-5555-5555-555555555104', '33333333-3333-3333-3333-333333333301', 'Secondi Piatti', 'secondi-mains', 'Braised meats, fire-roasted seafood, and traditional mains', 'beef', 4, true),
('55555555-5555-5555-5555-555555555105', '33333333-3333-3333-3333-333333333301', 'Dolci & Desserts', 'dolci', 'Classic Italian confections, gelato, and espresso pairings', 'cake-slice', 5, true)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- Malabar Categories
INSERT INTO public.menu_categories (id, hotel_id, name, slug, description, sort_order, is_active) VALUES
('55555555-5555-5555-5555-555555555201', '33333333-3333-3333-3333-333333333302', 'Coastal Starters & Small Plates', 'coastal-starters', 'Crisp coastal bites, spiced seafood fritters, and banana leaf wraps', 1, true),
('55555555-5555-5555-5555-555555555202', '33333333-3333-3333-3333-333333333302', 'Clay Pot Curries & Gravies', 'claypot-curries', 'Simmered slow in unglazed earthen pots with fresh pressed coconut milk', 2, true),
('55555555-5555-5555-5555-555555555203', '33333333-3333-3333-3333-333333333302', 'Seafood Specialties & Tawa Fry', 'seafood-fry', 'Day-boat fish marinated in crushed Tellicherry black pepper and griddled on iron tawa', 3, true),
('55555555-5555-5555-5555-555555555204', '33333333-3333-3333-3333-333333333302', 'Traditional Breads & Biryani', 'breads-biryani', 'Fragrant short-grain Kaima rice biryanis and hand-stretched layered parottas', 4, true),
('55555555-5555-5555-5555-555555555205', '33333333-3333-3333-3333-333333333302', 'Tropical Elixirs & Desserts', 'elixirs-desserts', 'Tender coconut puddings, jaggery confections, and spiced digestive tonics', 5, true)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- Paradise Categories
INSERT INTO public.menu_categories (id, hotel_id, name, slug, description, sort_order, is_active) VALUES
('55555555-5555-5555-5555-555555555301', '33333333-3333-3333-3333-333333333303', 'Prime Steaks & Chops', 'prime-steaks', 'USDA Prime cuts dry-aged in-house for 45 days and seared at 1200°F', 1, true),
('55555555-5555-5555-5555-555555555303', '33333333-3333-3333-3333-333333333303', 'Seafood & Raw Bar', 'raw-bar', 'Chilled lobster tails, king crab legs, and seasonal pristine oysters', 2, true),
('55555555-5555-5555-5555-555555555302', '33333333-3333-3333-3333-333333333303', 'Cocktail Mixology & Raw Bar', 'cocktails-raw-bar', 'Signature craft libations and chilled oysters on ice', 3, true),
('55555555-5555-5555-5555-555555555304', '33333333-3333-3333-3333-333333333303', 'Elevated Sides', 'elevated-sides', 'Truffle-infused accompaniments and wood-roasted farm vegetables', 4, true),
('55555555-5555-5555-5555-555555555305', '33333333-3333-3333-3333-333333333303', 'Decadent Desserts', 'rooftop-desserts', 'Warm cast-iron butter cakes and midnight espresso pairings', 5, true)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- 7. Menu Items for All Hotels
-- Royal Menu Items
INSERT INTO public.menu_items (
    hotel_id, category_id, name, slug, description, price, compare_at_price,
    image_url, dietary_tags, spicy_level, calories, preparation_time_minutes, allergens,
    is_available, is_featured, is_chef_special, sort_order
) VALUES
('20d386bd-2cdd-4157-8ecf-afa847957769', '20d386bd-2cdd-4157-8ecf-afa847957771', 'Oysters Rockefeller Royale', 'oysters-rockefeller-royale', 'Half dozen wild Prince Edward Island oysters baked with creamed watercress, Pernod absinthe, pancetta crisp, and Hollandaise gratinée.', 32.00, 38.00, 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=450&fit=crop', ARRAY['gluten_free'], 0, 290, 12, ARRAY['molluscs', 'dairy'], true, false, true, 1),
('20d386bd-2cdd-4157-8ecf-afa847957769', '5c34b3db-3b32-4a93-96a9-54c761f2e2d1', 'Wagyu A5 Striploin Steak', 'wagyu-a5-striploin', 'Authentic Miyazaki Japanese black cattle beef A5 BMS 11, seared on Binchotan charcoal with smoked sea salt flakes and wasabi stem.', 85.00, 95.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=450&fit=crop', ARRAY['chef-special', 'gluten-free', 'halal'], 0, 680, 15, ARRAY[]::text[], true, true, true, 1),
('20d386bd-2cdd-4157-8ecf-afa847957769', '5c34b3db-3b32-4a93-96a9-54c761f2e2d1', 'Lobster Thermidor Flambé', 'lobster-thermidor', 'Whole butter-poached Maine lobster stuffed with wild mushrooms, cognac cream reduction, gruyère gratinée and tarragon.', 58.00, NULL, 'https://images.unsplash.com/photo-1559742811-822873691df8?w=600&h=450&fit=crop', ARRAY['chef-special'], 0, 540, 20, ARRAY['crustaceans', 'dairy'], true, true, true, 2),
('20d386bd-2cdd-4157-8ecf-afa847957769', '5c34b3db-3b32-4a93-96a9-54c761f2e2d1', 'Imperial Oscietra Caviar Tartine', 'caviar-tartine', '30g Golden Oscietra caviar served atop brioche toast with whipped cultured isigny crème fraîche and chive flowers.', 95.00, NULL, 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&h=450&fit=crop', ARRAY['chef-special'], 0, 310, 8, ARRAY['fish', 'dairy', 'gluten'], true, true, true, 3),
('20d386bd-2cdd-4157-8ecf-afa847957769', '49ac670c-2795-4acf-b39c-071c56cc88e1', 'Black Truffle & Wild Mushroom Risotto', 'truffle-mushroom-risotto', 'Acquerello carnaroli rice simmered in mushroom broth with cultured butter, 36-month Parmigiano-Reggiano, and freshly shaved Norcia black truffles.', 36.00, NULL, 'https://images.unsplash.com/photo-1621996346565-e3d5d62817d2?w=600&h=450&fit=crop', ARRAY['vegetarian', 'gluten-free'], 0, 520, 18, ARRAY['dairy'], true, true, false, 1),
('20d386bd-2cdd-4157-8ecf-afa847957769', '49ac670c-2795-4acf-b39c-071c56cc88e1', 'Pan-Seared Chilean Sea Bass', 'chilean-sea-bass', 'Glazed in sweet white miso with lemongrass ginger emulsion, baby bok choy and lotus root crisps.', 44.00, NULL, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=450&fit=crop', ARRAY['gluten-free', 'halal'], 0, 480, 16, ARRAY['fish', 'soy'], true, true, false, 2),
('20d386bd-2cdd-4157-8ecf-afa847957769', 'e4008225-798e-4286-a8eb-c8e0b42268f1', 'Smoked Old Fashioned Cocktail', 'smoked-old-fashioned', 'WhistlePig 10-year rye whiskey, house-made demerara syrup, angostura bitters, infused with hickory smoke under a cloche.', 19.00, NULL, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=450&fit=crop', ARRAY['gluten-free', 'vegan'], 0, 160, 5, ARRAY[]::text[], true, false, false, 1),
('20d386bd-2cdd-4157-8ecf-afa847957769', 'e4008225-798e-4286-a8eb-c8e0b42268f1', 'Dom Pérignon Brut Champagne Flute', 'dom-perignon-flute', 'Vintage 2013 brut champagne with brioche, almond and white peach notes served chilled in crystal flutes.', 45.00, NULL, 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=600&h=450&fit=crop', ARRAY['vegan', 'gluten-free'], 0, 120, 3, ARRAY[]::text[], true, true, false, 2),
('20d386bd-2cdd-4157-8ecf-afa847957769', '20d386bd-2cdd-4157-8ecf-afa847957772', 'Golden Grand Marnier Soufflé', 'grand-marnier-souffle', 'Light-as-air orange blossom and Grand Marnier liqueur soufflé dusted with 24k edible gold leaf, served with Tahitian vanilla bean crème anglaise.', 24.00, NULL, 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=600&h=450&fit=crop', ARRAY['vegetarian'], 0, 410, 20, ARRAY['dairy', 'eggs'], true, true, false, 1),
('20d386bd-2cdd-4157-8ecf-afa847957769', '20d386bd-2cdd-4157-8ecf-afa847957772', 'Valrhona Dark Chocolate Ganache Dome', 'valrhona-chocolate-dome', '72% Single-origin Guanaja chocolate shell enclosing salted caramel mousse, hazelnut dacquoise biscuit, and raspberry coulis.', 22.00, NULL, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=450&fit=crop', ARRAY['vegetarian'], 0, 520, 8, ARRAY['dairy', 'tree_nuts', 'gluten'], true, false, false, 2)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- Gusto Menu Items
INSERT INTO public.menu_items (
    hotel_id, category_id, name, slug, description, price, compare_at_price,
    image_url, dietary_tags, spicy_level, calories, preparation_time_minutes, allergens,
    is_available, is_featured, is_chef_special, sort_order
) VALUES
('33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555101', 'Burrata Pugliese con Fichi', 'burrata-pugliese', 'Creamy imported Puglian burrata with caramelized black mission figs, 24-month aged balsamic pearls, toasted pistachios, and grilled sourdough.', 19.50, 22.00, 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&h=450&fit=crop', ARRAY['vegetarian'], 0, 420, 10, ARRAY['dairy', 'tree_nuts', 'gluten'], true, true, true, 1),
('33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555101', 'Polpo alla Griglia', 'polpo-alla-griglia', 'Charred Spanish octopus tentacle with smoked paprika potato emulsion, crispy caper berries, and Meyer lemon agrumato oil.', 23.00, NULL, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=450&fit=crop', ARRAY['gluten_free'], 1, 360, 15, ARRAY['molluscs'], true, false, false, 2),
('33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555102', 'Tagliolini al Tartufo Nero', 'tagliolini-tartufo', 'Silky egg yolk tagliolini tossed in cultured alpine butter, 30-month Parmigiano-Reggiano, and generously shaved Norcia black winter truffle.', 34.00, NULL, 'https://images.unsplash.com/photo-1621996346565-e3d5d62817d2?w=600&h=450&fit=crop', ARRAY['vegetarian'], 0, 580, 18, ARRAY['dairy', 'gluten', 'eggs'], true, true, true, 1),
('33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555102', 'Rigatoni all''Amatriciana', 'rigatoni-amatriciana', 'Bronze-cut rigatoni with crispy cured guanciale, sweet San Marzano DOP tomato sauce, crushed peperoncino, and sharp Pecorino Romano.', 26.00, NULL, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=450&fit=crop', ARRAY[]::text[], 2, 640, 15, ARRAY['gluten', 'dairy'], true, false, false, 2),
('33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555103', 'Margherita Verace STG', 'margherita-verace', 'San Marzano tomato coulis, fresh Fior di Latte mozzarella, organic sweet basil, Sicilian extra virgin olive oil, and sea salt.', 21.00, NULL, 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&h=450&fit=crop', ARRAY['vegetarian'], 0, 720, 8, ARRAY['dairy', 'gluten'], true, true, false, 1),
('33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555103', 'Diavola & Nduja Piccante', 'diavola-nduja', 'Tomato base, smoked provola, spicy Calabrian soppressata, fermented nduja dollops, hot honey drizzle, and fresh oregano.', 25.00, NULL, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=450&fit=crop', ARRAY[]::text[], 3, 810, 8, ARRAY['dairy', 'gluten'], true, false, true, 2),
('33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555105', 'Tiramisù Tradizionale al Mascarpone', 'tiramisu-tradizionale', 'Savoiardi ladyfingers soaked in dark espresso and Marsala wine, layered with fluffy mascarpone cream and dusted with Valrhona cocoa.', 14.00, NULL, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=450&fit=crop', ARRAY['vegetarian'], 0, 460, 5, ARRAY['dairy', 'gluten', 'eggs'], true, true, false, 1)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- Malabar Menu Items
INSERT INTO public.menu_items (
    hotel_id, category_id, name, slug, description, price, compare_at_price,
    image_url, dietary_tags, spicy_level, calories, preparation_time_minutes, allergens,
    is_available, is_featured, is_chef_special, sort_order
) VALUES
('33333333-3333-3333-3333-333333333302', '55555555-5555-5555-5555-555555555201', 'Malabar Prawn Pepper Fry', 'prawn-pepper-fry', 'Succulent tiger prawns wok-tossed with shallots, curry leaves, crushed Tellicherry black pepper, and toasted coconut slivers.', 22.00, NULL, 'https://images.unsplash.com/photo-1559742811-822873691df8?w=600&h=450&fit=crop', ARRAY['gluten_free', 'halal'], 2, 380, 14, ARRAY['crustaceans'], true, true, true, 1),
('33333333-3333-3333-3333-333333333302', '55555555-5555-5555-5555-555555555202', 'Alleppey Fish Curry in Mango & Coconut', 'alleppey-fish-curry', 'Fresh wild kingfish poached gently with tart raw green mangoes, bird''s eye chilies, turmeric, and fresh coconut cream in a traditional clay pot.', 28.00, 32.00, 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&h=450&fit=crop', ARRAY['gluten_free', 'halal'], 2, 520, 20, ARRAY['fish'], true, true, true, 1),
('33333333-3333-3333-3333-333333333302', '55555555-5555-5555-5555-555555555203', 'Karimeen Pollichathu in Banana Leaf', 'karimeen-pollichathu', 'Wild backwater pearl spot fish smothered in caramelized shallots, fiery green chilies, and ginger paste, wrapped in charred banana leaf and slow-griddled.', 32.00, 36.00, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=450&fit=crop', ARRAY['gluten_free', 'halal'], 3, 460, 22, ARRAY['fish'], true, true, true, 1),
('33333333-3333-3333-3333-333333333302', '55555555-5555-5555-5555-555555555203', 'Calicut Crab Roast with Roasted Coconut', 'calicut-crab-roast', 'Blue swimmer whole crab braised in dark roasted coriander, Tellicherry black peppercorns, curry leaves, and toasted fresh coconut chips.', 34.50, NULL, 'https://images.unsplash.com/photo-1559742811-822873691df8?w=600&h=450&fit=crop', ARRAY['gluten_free', 'halal'], 3, 510, 20, ARRAY['crustaceans'], true, false, true, 2),
('33333333-3333-3333-3333-333333333302', '55555555-5555-5555-5555-555555555204', 'Thalassery Mutton Dum Biryani', 'thalassery-mutton-biryani', 'Aromatic Jeerakasala short-grain rice layered with tender baby goat, slow cooked on dum with fried golden shallots, sultanas, and toasted cashews.', 26.00, NULL, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=450&fit=crop', ARRAY['halal'], 2, 780, 15, ARRAY['dairy', 'tree_nuts'], true, true, false, 1),
('33333333-3333-3333-3333-333333333302', '55555555-5555-5555-5555-555555555204', 'Crisp Flaky Malabar Parotta (Basket of 3)', 'malabar-parotta-basket', 'Hand-kneaded, spiral-coiled layered flatbreads griddled in ghee until golden and flaky. Best paired with clay pot curries.', 7.50, NULL, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=450&fit=crop', ARRAY['vegetarian'], 0, 380, 6, ARRAY['gluten', 'dairy'], true, false, false, 2),
('33333333-3333-3333-3333-333333333302', '55555555-5555-5555-5555-555555555205', 'Tender Coconut & Cardamom Payasam', 'tender-coconut-payasam', 'Silky chilled dessert made from young coconut meat pulp, fresh coconut milk, green cardamom, and golden palm jaggery.', 11.00, NULL, 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=600&h=450&fit=crop', ARRAY['vegan', 'gluten_free'], 0, 320, 5, ARRAY[]::text[], true, false, false, 1),
('33333333-3333-3333-3333-333333333302', '55555555-5555-5555-5555-555555555205', 'Spiced Kokum & Ginger Sparkler', 'kokum-ginger-sparkler', 'Sun-dried kokum extract infused with muddled ginger root, mint, roasted cumin, rock salt, and effervescent soda.', 8.50, NULL, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&h=450&fit=crop', ARRAY['vegan', 'gluten_free'], 1, 90, 4, ARRAY[]::text[], true, true, false, 2)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- Paradise Menu Items
INSERT INTO public.menu_items (
    hotel_id, category_id, name, slug, description, price, compare_at_price,
    image_url, dietary_tags, spicy_level, calories, preparation_time_minutes, allergens,
    is_available, is_featured, is_chef_special, sort_order
) VALUES
('33333333-3333-3333-3333-333333333303', '55555555-5555-5555-5555-555555555301', '45-Day Dry-Aged Tomahawk Ribeye (38 oz)', 'tomahawk-ribeye', 'Center-cut long bone ribeye crusted with smoked Maldon sea salt, rosemary tallow basting, and roasted bone marrow butter.', 145.00, NULL, 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&h=450&fit=crop', ARRAY['gluten_free'], 0, 1680, 25, ARRAY['dairy'], true, true, true, 1),
('33333333-3333-3333-3333-333333333303', '55555555-5555-5555-5555-555555555301', 'Center-Cut Filet Mignon with Black Truffle Butter (10 oz)', 'filet-mignon-truffle', 'USDA Prime tenderloin aged 35 days, pan-basted with foaming rosemary butter and topped with black summer truffle compound butter.', 64.00, 72.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=450&fit=crop', ARRAY['gluten_free'], 0, 720, 18, ARRAY['dairy'], true, true, false, 2),
('33333333-3333-3333-3333-333333333303', '55555555-5555-5555-5555-555555555303', 'Colossal Chilled Seafood Plateau', 'chilled-seafood-plateau', 'Maine lobster tail, 6 Alaskan king crab legs, 12 Kumamoto oysters on crushed ice, paired with atomic cocktail sauce and Dijon remoulade.', 125.00, NULL, 'https://images.unsplash.com/photo-1559742811-822873691df8?w=600&h=450&fit=crop', ARRAY['gluten_free'], 0, 650, 15, ARRAY['crustaceans', 'molluscs', 'mustard'], true, true, true, 1),
('33333333-3333-3333-3333-333333333303', '55555555-5555-5555-5555-555555555304', 'Hand-Cut Truffle Parmesan Russet Fries', 'truffle-parmesan-fries', 'Double-fried Idaho russet potatoes tossed in white truffle oil, grated 24-month Parmigiano-Reggiano, and fresh chives with garlic aioli.', 16.00, NULL, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=450&fit=crop', ARRAY['vegetarian'], 0, 490, 10, ARRAY['dairy', 'eggs'], true, false, false, 1),
('33333333-3333-3333-3333-333333333303', '55555555-5555-5555-5555-555555555302', 'Smoked Mezcalita Radiance', 'smoked-mezcalita', 'Artisanal Oaxacan mezcal, blood orange reduction, fresh lime, agave nectar, black volcanic salt rim, and cedar smoke bell jar.', 19.00, NULL, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=450&fit=crop', ARRAY['vegan', 'gluten_free'], 1, 180, 4, ARRAY[]::text[], true, true, false, 1),
('33333333-3333-3333-3333-333333333303', '55555555-5555-5555-5555-555555555302', 'Midnight Velvet Espresso Martini', 'midnight-espresso-martini', 'Belvedere vodka, fresh pulled ristretto espresso, Kahlúa coffee liqueur, Madagascar vanilla bean syrup, garnished with three roasted espresso beans.', 18.50, NULL, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=450&fit=crop', ARRAY['vegan', 'gluten_free'], 0, 210, 5, ARRAY[]::text[], true, false, false, 2),
('33333333-3333-3333-3333-333333333303', '55555555-5555-5555-5555-555555555305', 'Cast-Iron Warm Kentucky Bourbon Butter Cake', 'bourbon-butter-cake', 'Rich golden butter cake served piping hot in skillet with Maker''s Mark bourbon butter glaze and a scoop of toasted pecan gelato.', 15.00, NULL, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=450&fit=crop', ARRAY['vegetarian'], 0, 620, 12, ARRAY['dairy', 'gluten', 'eggs', 'tree_nuts'], true, true, false, 1)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- 8. Financial Accounts
INSERT INTO public.hotel_financial_accounts (
    id, hotel_id, account_name, account_type, account_number_last4,
    opening_balance, current_balance, currency, is_active
) VALUES
('66666666-6666-6666-6666-666666666001', '20d386bd-2cdd-4157-8ecf-afa847957769', 'Silicon Valley Bank Commercial', 'bank', '9044', 68000.00, 94150.00, 'USD', true),
('66666666-6666-6666-6666-666666666002', '20d386bd-2cdd-4157-8ecf-afa847957769', 'Penthouse Vault Cash Drawer', 'cash', '0005', 4000.00, 6200.00, 'USD', true),
('66666666-6666-6666-6666-666666666101', '33333333-3333-3333-3333-333333333301', 'Chase Business Operating', 'bank', '9421', 12500.00, 16840.50, 'USD', true),
('66666666-6666-6666-6666-666666666102', '33333333-3333-3333-3333-333333333301', 'Front Register Cash Drawer', 'cash', '0001', 800.00, 1250.00, 'USD', true),
('66666666-6666-6666-6666-666666666201', '33333333-3333-3333-3333-333333333302', 'Wells Fargo Commercial Checking', 'bank', '3318', 24000.00, 31450.00, 'USD', true),
('66666666-6666-6666-6666-666666666202', '33333333-3333-3333-3333-333333333302', 'Dining Hall Cash Register', 'cash', '0002', 1200.00, 1840.00, 'USD', true),
('66666666-6666-6666-6666-666666666301', '33333333-3333-3333-3333-333333333303', 'Bank of America Merchant Operating', 'bank', '8910', 42000.00, 56800.00, 'USD', true),
('66666666-6666-6666-6666-666666666302', '33333333-3333-3333-3333-333333333303', 'Rooftop Bar Cash Register', 'cash', '0003', 2500.00, 3950.00, 'USD', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Accounting Categories
INSERT INTO public.hotel_accounting_categories (id, hotel_id, type, name, description, is_system) VALUES
('77777777-7777-7777-7777-777777777001', '20d386bd-2cdd-4157-8ecf-afa847957769', 'income', 'VIP Dining & Banquets', 'Fine dining revenue and private room buyouts', true),
('77777777-7777-7777-7777-777777777002', '20d386bd-2cdd-4157-8ecf-afa847957769', 'expense', 'Truffles & Specialty Meat Imports', 'Norcia truffles, A5 Miyazaki Wagyu shipments', true),
('77777777-7777-7777-7777-777777777101', '33333333-3333-3333-3333-333333333301', 'income', 'Private Dining & Events', 'Revenue from buyouts and private parties', true),
('77777777-7777-7777-7777-777777777102', '33333333-3333-3333-3333-333333333301', 'income', 'Catering & Pre-orders', 'Offsite corporate catering orders', true),
('77777777-7777-7777-7777-777777777103', '33333333-3333-3333-3333-333333333301', 'expense', 'Fresh Organic Produce', 'Purchases from Hudson Valley local farms', true),
('77777777-7777-7777-7777-777777777104', '33333333-3333-3333-3333-333333333301', 'expense', 'Flour & Italian Dairy Import', 'Specialty 00 flour and cheese shipments', true),
('77777777-7777-7777-7777-777777777105', '33333333-3333-3333-3333-333333333301', 'expense', 'Software & DineFlow SaaS', 'SaaS subscriptions and POS integrations', true),
('77777777-7777-7777-7777-777777777201', '33333333-3333-3333-3333-333333333302', 'income', 'Dining Room Sales', 'General restaurant daily guest sales', true),
('77777777-7777-7777-7777-777777777202', '33333333-3333-3333-3333-333333333302', 'income', 'Catering & Banquets', 'Corporate luncheons and wedding catering', true),
('77777777-7777-7777-7777-777777777203', '33333333-3333-3333-3333-333333333302', 'expense', 'Fresh Seafood Procurement', 'Daily harbor fish and tiger prawn delivery', true),
('77777777-7777-7777-7777-777777777301', '33333333-3333-3333-3333-333333333303', 'income', 'Rooftop Dining & Steaks', 'Prime steakhouse dining receipts', true),
('77777777-7777-7777-7777-777777777302', '33333333-3333-3333-3333-333333333303', 'income', 'VIP Cabana Lounge Buyouts', 'Bottle service and cabana reservations', true),
('77777777-7777-7777-7777-777777777303', '33333333-3333-3333-3333-333333333303', 'expense', 'Prime Beef Purveyors', 'Dry-aged USDA Prime cuts and bone-in steaks', true)
ON CONFLICT (id) DO NOTHING;

-- 10. Financial Transactions (Ledger & Audit Trail)
INSERT INTO public.hotel_financial_transactions (
    hotel_id, account_id, category_id, type, amount, transaction_date,
    payment_method, reference_number, description, is_voided, void_reason
) VALUES
-- Royal Transactions
('20d386bd-2cdd-4157-8ecf-afa847957769', '66666666-6666-6666-6666-666666666001', '77777777-7777-7777-7777-777777777001', 'income', 12450.00, CURRENT_DATE - INTERVAL '1 day', 'credit_card', 'AMEX-ROY-892', 'Gala Evening Tasting Menu & Dom Pérignon Flutes', false, null),
('20d386bd-2cdd-4157-8ecf-afa847957769', '66666666-6666-6666-6666-666666666002', '77777777-7777-7777-7777-777777777001', 'income', 2200.00, CURRENT_DATE - INTERVAL '1 day', 'cash', 'CSH-ROY-01', 'Vault Cash deposit from VIP lounge tables', false, null),
('20d386bd-2cdd-4157-8ecf-afa847957769', '66666666-6666-6666-6666-666666666001', '77777777-7777-7777-7777-777777777002', 'expense', 4800.00, CURRENT_DATE - INTERVAL '2 days', 'bank_transfer', 'INV-MIYAZAKI-91', 'Miyazaki A5 Wagyu Tenderloin direct cold freight', false, null),
('20d386bd-2cdd-4157-8ecf-afa847957769', '66666666-6666-6666-6666-666666666001', '77777777-7777-7777-7777-777777777001', 'income', 3200.00, CURRENT_DATE - INTERVAL '4 days', 'credit_card', 'VOID-SAMPLE-01', 'Duplicate billing entry test for POS system', true, 'Duplicate transaction test recorded by accounting audit team'),
-- Gusto Transactions
('33333333-3333-3333-3333-333333333301', '66666666-6666-6666-6666-666666666101', '77777777-7777-7777-7777-777777777101', 'income', 3840.00, CURRENT_DATE - INTERVAL '1 day', 'credit_card', 'POS-GUSTO-101', 'Saturday Dinner Service Dining Rush', false, null),
('33333333-3333-3333-3333-333333333301', '66666666-6666-6666-6666-666666666102', '77777777-7777-7777-7777-777777777101', 'income', 1620.00, CURRENT_DATE, 'cash', 'CASH-REG-02', 'Sunday Lunch Cash Register Receipts', false, null),
('33333333-3333-3333-3333-333333333301', '66666666-6666-6666-6666-666666666101', '77777777-7777-7777-7777-777777777103', 'expense', 780.00, CURRENT_DATE - INTERVAL '2 days', 'bank_transfer', 'INV-FARMS-44', 'Hudson Valley Organic heirloom tomatoes and basil', false, null),
-- Malabar Transactions
('33333333-3333-3333-3333-333333333302', '66666666-6666-6666-6666-666666666201', '77777777-7777-7777-7777-777777777201', 'income', 4850.00, CURRENT_DATE - INTERVAL '1 day', 'credit_card', 'BAT-20261016', 'Stripe POS settlement from dinner rush', false, null),
('33333333-3333-3333-3333-333333333302', '66666666-6666-6666-6666-666666666201', '77777777-7777-7777-7777-777777777203', 'expense', 1140.00, CURRENT_DATE - INTERVAL '2 days', 'bank_transfer', 'INV-FISH-502', 'Fishermans Wharf 45kg fresh prawns & kingfish', false, null),
-- Paradise Transactions
('33333333-3333-3333-3333-333333333303', '66666666-6666-6666-6666-666666666301', '77777777-7777-7777-7777-777777777301', 'income', 8400.00, CURRENT_DATE - INTERVAL '1 day', 'credit_card', 'SETTLE-PAR-901', 'Friday evening rooftop steak dinner rush', false, null),
('33333333-3333-3333-3333-333333333303', '66666666-6666-6666-6666-666666666301', '77777777-7777-7777-7777-777777777303', 'expense', 3100.00, CURRENT_DATE - INTERVAL '2 days', 'bank_transfer', 'INV-BEEF-882', 'Allen Brothers USDA Prime Tomahawk & Ribeye delivery', false, null);

-- 11. REST API Keys
INSERT INTO public.api_keys (
    hotel_id, name, key_hash, key_prefix, is_active, last_used_at
) VALUES
('20d386bd-2cdd-4157-8ecf-afa847957769', 'Front Desk POS Terminal', crypt('df_live_royal_secret_2026', gen_salt('bf')), 'df_live_roy', true, now() - INTERVAL '2 hours'),
('33333333-3333-3333-3333-333333333301', 'Kitchen Display System (KDS)', crypt('df_live_gusto_secret_2026', gen_salt('bf')), 'df_live_gus', true, now() - INTERVAL '4 hours'),
('33333333-3333-3333-3333-333333333302', 'Malabar Website & Kiosk API', crypt('df_live_malabar_secret_2026', gen_salt('bf')), 'df_live_mal', true, now() - INTERVAL '3 hours'),
('33333333-3333-3333-3333-333333333303', 'Paradise Rooftop POS Sync', crypt('df_live_paradise_secret_2026', gen_salt('bf')), 'df_live_par', true, now() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- 12. Platform Invoices for Super Admin
INSERT INTO public.platform_invoices (
    id, hotel_id, subscription_id, invoice_number, issue_date, due_date,
    billing_period_start, billing_period_end, subtotal, discount_amount,
    tax_percent, tax_amount, total_amount, paid_amount, status, notes
) VALUES
(
    '88888888-8888-8888-8888-888888888101',
    '33333333-3333-3333-3333-333333333301',
    '44444444-4444-4444-4444-444444444401',
    'INV-2026-0001',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    79.00,
    0.00,
    8.875,
    7.01,
    86.01,
    86.01,
    'paid',
    'Pro Culinary monthly billing - Paid in full'
),
(
    '88888888-8888-8888-8888-888888888102',
    '33333333-3333-3333-3333-333333333302',
    '44444444-4444-4444-4444-444444444402',
    'INV-2026-0002',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '20 days',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '355 days',
    1990.00,
    100.00,
    0.00,
    0.00,
    1890.00,
    1890.00,
    'paid',
    'Enterprise Grand annual subscription'
),
(
    '88888888-8888-8888-8888-888888888103',
    '33333333-3333-3333-3333-333333333303',
    '44444444-4444-4444-4444-444444444403',
    'INV-2026-0003',
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '12 days',
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '28 days',
    29.00,
    0.00,
    7.00,
    2.03,
    31.03,
    0.00,
    'unpaid',
    'Base Starter monthly renewal'
),
(
    '88888888-8888-8888-8888-888888888104',
    '20d386bd-2cdd-4157-8ecf-afa847957769',
    '3352fb12-b67f-4c72-8059-6298ea30e827',
    'INV-2026-0004',
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '350 days',
    1990.00,
    0.00,
    0.00,
    0.00,
    1990.00,
    1990.00,
    'paid',
    'Enterprise Grand Annual Subscription - VIP Onboarding'
)
ON CONFLICT (invoice_number) DO NOTHING;

-- Invoice line items
INSERT INTO public.platform_invoice_items (invoice_id, description, quantity, unit_price, total) VALUES
('88888888-8888-8888-8888-888888888101', 'DineFlow Pro Culinary - 1 Month Subscription', 1, 79.00, 79.00),
('88888888-8888-8888-8888-888888888102', 'DineFlow Enterprise Grand - Annual Package', 1, 1990.00, 1990.00),
('88888888-8888-8888-8888-888888888103', 'DineFlow Base Starter - 1 Month Subscription', 1, 29.00, 29.00),
('88888888-8888-8888-8888-888888888104', 'DineFlow Enterprise Grand Annual License + Cloudinary Suite', 1, 1990.00, 1990.00)
ON CONFLICT DO NOTHING;

-- 13. Platform Payments
INSERT INTO public.platform_payments (
    id, invoice_id, hotel_id, payment_date, amount, payment_method, reference_number, notes, recorded_by
) VALUES
('99999999-9999-9999-9999-999999999101', '88888888-8888-8888-8888-888888888101', '33333333-3333-3333-3333-333333333301', CURRENT_DATE - INTERVAL '28 days', 86.01, 'credit_card_manual', 'STRIPE_CH_9941', 'Monthly auto-debit successful', '00000000-0000-0000-0000-000000000001'),
('99999999-9999-9999-9999-999999999102', '88888888-8888-8888-8888-888888888102', '33333333-3333-3333-3333-333333333302', CURRENT_DATE - INTERVAL '8 days', 1890.00, 'bank_transfer', 'WIRE_WF_8831', 'Wire transfer processed for annual enterprise package', '00000000-0000-0000-0000-000000000001'),
('99999999-9999-9999-9999-999999999103', '88888888-8888-8888-8888-888888888104', '20d386bd-2cdd-4157-8ecf-afa847957769', CURRENT_DATE - INTERVAL '14 days', 1990.00, 'credit_card_manual', 'AMEX_CENT_201', 'Amex Centurion black card annual payment', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 14. Hotel Dining Tables
INSERT INTO public.hotel_tables (id, hotel_id, table_number, capacity, section, status) VALUES
('aaaaaaa1-1111-1111-1111-111111111101', '20d386bd-2cdd-4157-8ecf-afa847957769', 'T-01', 2, 'Main Dining Hall', 'available'),
('aaaaaaa1-1111-1111-1111-111111111102', '20d386bd-2cdd-4157-8ecf-afa847957769', 'T-02', 4, 'Main Dining Hall', 'occupied'),
('aaaaaaa1-1111-1111-1111-111111111103', '20d386bd-2cdd-4157-8ecf-afa847957769', 'T-03', 4, 'Terrace Promenade', 'calling_waiter'),
('aaaaaaa1-1111-1111-1111-111111111104', '20d386bd-2cdd-4157-8ecf-afa847957769', 'VIP-1', 8, 'Penthouse Lounge', 'occupied'),
('aaaaaaa1-1111-1111-1111-111111111105', '20d386bd-2cdd-4157-8ecf-afa847957769', 'VIP-2', 6, 'Penthouse Lounge', 'available'),
('aaaaaaa1-1111-1111-1111-111111111106', '20d386bd-2cdd-4157-8ecf-afa847957769', 'BAR-1', 2, 'Grand Cellar Bar', 'available'),
('aaaaaaa2-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333301', 'T-01', 2, 'Piazza Dining', 'available'),
('aaaaaaa2-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333301', 'T-02', 4, 'Piazza Dining', 'occupied'),
('aaaaaaa2-1111-1111-1111-111111111103', '33333333-3333-3333-3333-333333333301', 'T-03', 6, 'Wine Cask Room', 'available'),
('aaaaaaa3-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333302', 'T-01', 4, 'Coastal Courtyard', 'available'),
('aaaaaaa3-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333302', 'T-02', 6, 'Banana Leaf Hall', 'occupied')
ON CONFLICT (hotel_id, table_number) DO NOTHING;

-- 15. Live Orders
INSERT INTO public.orders (
    id, hotel_id, table_id, table_number, order_number, guest_name,
    status, subtotal, tax_amount, total_amount, payment_status, payment_method, special_instructions
) VALUES
(
    'bbbbbbb1-1111-1111-1111-111111111101',
    '20d386bd-2cdd-4157-8ecf-afa847957769',
    'aaaaaaa1-1111-1111-1111-111111111102',
    'T-02',
    'ORD-201',
    'Lord Charles',
    'in_kitchen',
    260.00,
    23.40,
    283.40,
    'unpaid',
    null,
    'Steaks medium rare, extra wasabi on the side'
),
(
    'bbbbbbb1-1111-1111-1111-111111111102',
    '20d386bd-2cdd-4157-8ecf-afa847957769',
    'aaaaaaa1-1111-1111-1111-111111111104',
    'VIP-1',
    'ORD-202',
    'Elena Rostova',
    'confirmed',
    283.00,
    25.47,
    308.47,
    'unpaid',
    null,
    'Celebrating anniversary, please serve champagne first'
)
ON CONFLICT DO NOTHING;

-- 16. Order Items
INSERT INTO public.order_items (id, order_id, item_name, unit_price, quantity, total_price, special_notes) VALUES
('ccccccc1-1111-1111-1111-111111111101', 'bbbbbbb1-1111-1111-1111-111111111101', 'Wagyu A5 Striploin Steak', 85.00, 2, 170.00, 'Medium-rare'),
('ccccccc1-1111-1111-1111-111111111102', 'bbbbbbb1-1111-1111-1111-111111111101', 'Dom Pérignon Brut Champagne Flute', 45.00, 2, 90.00, 'Chilled crystal flutes'),
('ccccccc1-1111-1111-1111-111111111103', 'bbbbbbb1-1111-1111-1111-111111111102', 'Imperial Oscietra Caviar Tartine', 95.00, 1, 95.00, null),
('ccccccc1-1111-1111-1111-111111111104', 'bbbbbbb1-1111-1111-1111-111111111102', 'Lobster Thermidor Flambé', 58.00, 2, 116.00, 'Extra tarragon butter'),
('ccccccc1-1111-1111-1111-111111111105', 'bbbbbbb1-1111-1111-1111-111111111102', 'Black Truffle & Wild Mushroom Risotto', 36.00, 2, 72.00, null)
ON CONFLICT DO NOTHING;

-- 17. Waiter Service Calls
INSERT INTO public.waiter_calls (id, hotel_id, table_id, table_number, request_type, custom_note, status) VALUES
('ddddddd1-1111-1111-1111-111111111101', '20d386bd-2cdd-4157-8ecf-afa847957769', 'aaaaaaa1-1111-1111-1111-111111111103', 'T-03', 'water_refill', 'Need sparkling water with lemon', 'pending'),
('ddddddd1-1111-1111-1111-111111111102', '20d386bd-2cdd-4157-8ecf-afa847957769', 'aaaaaaa1-1111-1111-1111-111111111102', 'T-02', 'bring_cutlery', 'Additional steak knife and dessert spoons', 'attending')
ON CONFLICT DO NOTHING;
