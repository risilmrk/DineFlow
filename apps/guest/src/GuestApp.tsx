import React, { useState, useEffect } from 'react';
import { Hotel, MenuCategory, MenuItem, supabase } from '@dineflow/database';
import { GuestHeader } from './modules/header/GuestHeader';
import { GuestMenuModule } from './modules/menu/GuestMenuModule';

export interface GuestAppProps {
  hotelSlug: string;
}

export const GuestApp: React.FC<GuestAppProps> = ({ hotelSlug }) => {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGuestMenu() {
      try {
        setLoading(true);
        // Fetch hotel record by slug
        const { data: hotelData } = await supabase
          .from('hotels')
          .select('*')
          .eq('slug', hotelSlug)
          .single();

        if (hotelData) {
          setHotel(hotelData);

          // Fetch categories & dishes in parallel
          const [catRes, itemRes] = await Promise.all([
            supabase
              .from('menu_categories')
              .select('*')
              .eq('hotel_id', hotelData.id)
              .eq('is_active', true)
              .order('sort_order'),
            supabase
              .from('menu_items')
              .select('*, category:menu_categories(*)')
              .eq('hotel_id', hotelData.id)
              .order('sort_order'),
          ]);

          setCategories(catRes.data || []);
          setItems(itemRes.data || []);
        }
      } catch (err) {
        console.error('Error loading guest digital menu:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGuestMenu();
  }, [hotelSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Loading Guest Menu...
          </p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-400 text-center">
        <div className="space-y-3 max-w-sm">
          <h2 className="text-xl font-bold text-white font-serif">Menu Unavailable</h2>
          <p className="text-xs text-slate-400">
            No active restaurant found for subdomain <code className="text-orange-400">{hotelSlug}</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-orange-500 selection:text-white">
      <GuestHeader hotel={hotel} />

      <main className="flex-1 px-4 sm:px-6 py-6 pb-20 max-w-4xl w-full mx-auto">
        <GuestMenuModule
          categories={categories}
          items={items}
          currencySymbol={hotel.currency_symbol || '$'}
        />
      </main>

      {/* Discreet footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-[11px] text-slate-400">
        Digital Menu by DineFlow SaaS Platform
      </footer>
    </div>
  );
};
