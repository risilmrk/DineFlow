-- ==============================================================================
-- DineFlow Production Seed Data: Gusto, Malabar, Paradise & Platform Plans
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

-- 4. Seed Hotels (Gusto, Malabar, Paradise)
INSERT INTO public.hotels (
    id, name, slug, custom_domain, status, logo_url, cover_image_url,
    theme_color, tagline, description, address, phone, email, currency, currency_symbol,
    operating_hours, social_links
) VALUES
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
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    theme_color = EXCLUDED.theme_color;

-- 5. Subscriptions for Hotels
INSERT INTO public.hotel_subscriptions (
    id, hotel_id, plan_id, billing_cycle, status, start_date, expiry_date, notes
) VALUES
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

-- 6. Gusto Categories
INSERT INTO public.menu_categories (id, hotel_id, name, slug, description, icon, sort_order, is_active) VALUES
('55555555-5555-5555-5555-555555555101', '33333333-3333-3333-3333-333333333301', 'Antipasti & Starters', 'antipasti', 'Small sharing plates, artisan breads, and cured Italian delicacies', 'utensils', 1, true),
('55555555-5555-5555-5555-555555555102', '33333333-3333-3333-3333-333333333301', 'Handmade Fresh Pastas', 'primi-pastas', 'Extruded and hand-rolled pastas made fresh in-house every morning', 'wheat', 2, true),
('55555555-5555-5555-5555-555555555103', '33333333-3333-3333-3333-333333333301', 'Woodfired Pizzas', 'woodfired-pizzas', '48-hour fermented sourdough baked in our 900°F Marra Forni oven', 'flame', 3, true),
('55555555-5555-5555-5555-555555555104', '33333333-3333-3333-3333-333333333301', 'Secondi Piatti', 'secondi-mains', 'Braised meats, fire-roasted seafood, and traditional mains', 'beef', 4, true),
('55555555-5555-5555-5555-555555555105', '33333333-3333-3333-3333-333333333301', 'Dolci & Desserts', 'dolci', 'Classic Italian confections, gelato, and espresso pairings', 'cake-slice', 5, true)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- 7. Gusto Menu Items
INSERT INTO public.menu_items (
    hotel_id, category_id, name, slug, description, price, compare_at_price,
    image_url, dietary_tags, spicy_level, calories, preparation_time_minutes, allergens,
    is_available, is_featured, is_chef_special, sort_order
) VALUES
(
    '33333333-3333-3333-3333-333333333301',
    '55555555-5555-5555-5555-555555555101',
    'Burrata Pugliese con Fichi',
    'burrata-pugliese',
    'Creamy imported Puglian burrata with caramelized black mission figs, 24-month aged balsamic pearls, toasted pistachios, and grilled sourdough.',
    19.50,
    22.00,
    'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&h=450&fit=crop',
    ARRAY['vegetarian'],
    0,
    420,
    10,
    ARRAY['dairy', 'tree_nuts', 'gluten'],
    true,
    true,
    true,
    1
),
(
    '33333333-3333-3333-3333-333333333301',
    '55555555-5555-5555-5555-555555555101',
    'Polpo alla Griglia',
    'polpo-alla-griglia',
    'Charred Spanish octopus tentacle with smoked paprika potato emulsion, crispy caper berries, and Meyer lemon agrumato oil.',
    23.00,
    NULL,
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=450&fit=crop',
    ARRAY['gluten_free'],
    1,
    360,
    15,
    ARRAY['molluscs'],
    true,
    false,
    false,
    2
),
(
    '33333333-3333-3333-3333-333333333301',
    '55555555-5555-5555-5555-555555555102',
    'Tagliolini al Tartufo Nero',
    'tagliolini-tartufo',
    'Silky egg yolk tagliolini tossed in cultured alpine butter, 30-month Parmigiano-Reggiano, and generously shaved Norcia black winter truffle.',
    34.00,
    NULL,
    'https://images.unsplash.com/photo-1621996346565-e3d5d62817d2?w=600&h=450&fit=crop',
    ARRAY['vegetarian'],
    0,
    580,
    18,
    ARRAY['dairy', 'gluten', 'eggs'],
    true,
    true,
    true,
    1
),
(
    '33333333-3333-3333-3333-333333333301',
    '55555555-5555-5555-5555-555555555102',
    'Rigatoni all''Amatriciana',
    'rigatoni-amatriciana',
    'Bronze-cut rigatoni with crispy cured guanciale, sweet San Marzano DOP tomato sauce, crushed peperoncino, and sharp Pecorino Romano.',
    26.00,
    NULL,
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=450&fit=crop',
    ARRAY[]::text[],
    2,
    640,
    15,
    ARRAY['gluten', 'dairy'],
    true,
    false,
    false,
    2
),
(
    '33333333-3333-3333-3333-333333333301',
    '55555555-5555-5555-5555-555555555103',
    'Margherita Verace STG',
    'margherita-verace',
    'San Marzano tomato coulis, fresh Fior di Latte mozzarella, organic sweet basil, Sicilian extra virgin olive oil, and sea salt.',
    21.00,
    NULL,
    'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&h=450&fit=crop',
    ARRAY['vegetarian'],
    0,
    720,
    8,
    ARRAY['dairy', 'gluten'],
    true,
    true,
    false,
    1
),
(
    '33333333-3333-3333-3333-333333333301',
    '55555555-5555-5555-5555-555555555103',
    'Diavola & Nduja Piccante',
    'diavola-nduja',
    'Tomato base, smoked provola, spicy Calabrian soppressata, fermented nduja dollops, hot honey drizzle, and fresh oregano.',
    25.00,
    NULL,
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=450&fit=crop',
    ARRAY[]::text[],
    3,
    810,
    8,
    ARRAY['dairy', 'gluten'],
    true,
    false,
    true,
    2
),
(
    '33333333-3333-3333-3333-333333333301',
    '55555555-5555-5555-5555-555555555105',
    'Tiramisù Tradizionale al Mascarpone',
    'tiramisu-tradizionale',
    'Savoiardi ladyfingers soaked in dark espresso and Marsala wine, layered with fluffy mascarpone cream and dusted with Valrhona cocoa.',
    14.00,
    NULL,
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=450&fit=crop',
    ARRAY['vegetarian'],
    0,
    460,
    5,
    ARRAY['dairy', 'gluten', 'eggs'],
    true,
    true,
    false,
    1
)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- 8. Malabar Categories & Menu Items
INSERT INTO public.menu_categories (id, hotel_id, name, slug, description, icon, sort_order, is_active) VALUES
('55555555-5555-5555-5555-555555555201', '33333333-3333-3333-3333-333333333302', 'Coastal Starters & Small Plates', 'coastal-starters', 'Crisp coastal bites, spiced seafood fritters, and banana leaf wraps', 'sparkles', 1, true),
('55555555-5555-5555-5555-555555555202', '33333333-3333-3333-3333-333333333302', 'Clay Pot Curries & Gravies', 'claypot-curries', 'Simmered slow in unglazed earthern pots with fresh pressed coconut milk', 'soup', 2, true),
('55555555-5555-5555-5555-555555555203', '33333333-3333-3333-3333-333333333302', 'Seafood Specialties & Tawa Fry', 'seafood-fry', 'Day-boat fish marinated in crushed Tellicherry black pepper and griddled', 'fish', 3, true)
ON CONFLICT (hotel_id, slug) DO NOTHING;

INSERT INTO public.menu_items (
    hotel_id, category_id, name, slug, description, price, compare_at_price,
    image_url, dietary_tags, spicy_level, calories, preparation_time_minutes, allergens,
    is_available, is_featured, is_chef_special, sort_order
) VALUES
(
    '33333333-3333-3333-3333-333333333302',
    '55555555-5555-5555-5555-555555555201',
    'Malabar Prawn Pepper Fry',
    'prawn-pepper-fry',
    'Succulent tiger prawns wok-tossed with shallots, curry leaves, crushed Tellicherry black pepper, and toasted coconut slivers.',
    22.00,
    NULL,
    'https://images.unsplash.com/photo-1559742811-822873691df8?w=600&h=450&fit=crop',
    ARRAY['gluten_free', 'halal'],
    2,
    380,
    14,
    ARRAY['crustaceans'],
    true,
    true,
    true,
    1
),
(
    '33333333-3333-3333-3333-333333333302',
    '55555555-5555-5555-5555-555555555202',
    'Alleppey Fish Curry in Mango & Coconut',
    'alleppey-fish-curry',
    'Fresh wild kingfish poached gently with tart raw green mangoes, bird''s eye chilies, turmeric, and fresh coconut cream in a traditional clay pot.',
    28.00,
    32.00,
    'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&h=450&fit=crop',
    ARRAY['gluten_free', 'halal'],
    2,
    520,
    20,
    ARRAY['fish'],
    true,
    true,
    true,
    1
)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- 9. Paradise Categories & Menu Items
INSERT INTO public.menu_categories (id, hotel_id, name, slug, description, icon, sort_order, is_active) VALUES
('55555555-5555-5555-5555-555555555301', '33333333-3333-3333-3333-333333333303', 'Prime Steaks & Chops', 'prime-steaks', 'USDA Prime cuts dry-aged in-house for 45 days and seared at 1200°F', 'flame', 1, true),
('55555555-5555-5555-5555-555555555302', '33333333-3333-3333-3333-333333333303', 'Cocktail Mixology & Raw Bar', 'cocktails-raw-bar', 'Signature craft libations and chilled oysters on ice', 'glass-water', 2, true)
ON CONFLICT (hotel_id, slug) DO NOTHING;

INSERT INTO public.menu_items (
    hotel_id, category_id, name, slug, description, price, compare_at_price,
    image_url, dietary_tags, spicy_level, calories, preparation_time_minutes, allergens,
    is_available, is_featured, is_chef_special, sort_order
) VALUES
(
    '33333333-3333-3333-3333-333333333303',
    '55555555-5555-5555-5555-555555555301',
    '45-Day Dry-Aged Tomahawk Ribeye (38 oz)',
    'tomahawk-ribeye',
    'Center-cut long bone ribeye crusted with smoked Maldon sea salt, rosemary tallow basting, and roasted bone marrow butter.',
    145.00,
    NULL,
    'https://images.unsplash.com/photo-1558030006-450675393462?w=600&h=450&fit=crop',
    ARRAY['gluten_free'],
    0,
    1680,
    25,
    ARRAY['dairy'],
    true,
    true,
    true,
    1
),
(
    '33333333-3333-3333-3333-333333333303',
    '55555555-5555-5555-5555-555555555302',
    'Smoked Mezcalita Radiance',
    'smoked-mezcalita',
    'Artisanal Oaxacan mezcal, blood orange reduction, fresh lime, agave nectar, black volcanic salt rim, and cedar smoke bell jar.',
    19.00,
    NULL,
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=450&fit=crop',
    ARRAY['vegan', 'gluten_free'],
    1,
    180,
    4,
    ARRAY[]::text[],
    true,
    true,
    false,
    1
)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- 10. Financial Accounts for Gusto
INSERT INTO public.hotel_financial_accounts (
    id, hotel_id, account_name, account_type, account_number_last4,
    opening_balance, current_balance, currency, is_active
) VALUES
('66666666-6666-6666-6666-666666666101', '33333333-3333-3333-3333-333333333301', 'Chase Business Operating', 'bank', '9421', 12500.00, 16840.50, 'USD', true),
('66666666-6666-6666-6666-666666666102', '33333333-3333-3333-3333-333333333301', 'Front Register Cash Drawer', 'cash', '0001', 800.00, 1250.00, 'USD', true)
ON CONFLICT (id) DO NOTHING;

-- Accounting categories for Gusto
INSERT INTO public.hotel_accounting_categories (id, hotel_id, type, name, description, is_system) VALUES
('77777777-7777-7777-7777-777777777101', '33333333-3333-3333-3333-333333333301', 'income', 'Private Dining & Events', 'Revenue from buyouts and private parties', true),
('77777777-7777-7777-7777-777777777102', '33333333-3333-3333-3333-333333333301', 'income', 'Catering & Pre-orders', 'Offsite corporate catering orders', true),
('77777777-7777-7777-7777-777777777103', '33333333-3333-3333-3333-333333333301', 'expense', 'Fresh Organic Produce', 'Purchases from Hudson Valley local farms', true),
('77777777-7777-7777-7777-777777777104', '33333333-3333-3333-3333-333333333301', 'expense', 'Flour & Italian Dairy Import', 'Specialty 00 flour and cheese shipments', true),
('77777777-7777-7777-7777-777777777105', '33333333-3333-3333-3333-333333333301', 'expense', 'Software & DineFlow SaaS', 'SaaS subscriptions and POS integrations', true)
ON CONFLICT (id) DO NOTHING;

-- 11. Platform Invoices for Super Admin
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
)
ON CONFLICT (invoice_number) DO NOTHING;

-- Invoice line items
INSERT INTO public.platform_invoice_items (invoice_id, description, quantity, unit_price, total) VALUES
('88888888-8888-8888-8888-888888888101', 'DineFlow Pro Culinary - 1 Month Subscription', 1, 79.00, 79.00),
('88888888-8888-8888-8888-888888888102', 'DineFlow Enterprise Grand - Annual Package', 1, 1990.00, 1990.00),
('88888888-8888-8888-8888-888888888103', 'DineFlow Base Starter - 1 Month Subscription', 1, 29.00, 29.00)
ON CONFLICT DO NOTHING;
