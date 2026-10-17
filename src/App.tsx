import React, { useState, useEffect } from 'react';
import { resolveTenant, ResolvedPanel } from '@dineflow/core';
import { LandingApp } from '@dineflow/app-landing';
import { SuperAdminApp } from '@dineflow/app-superadmin';
import { AdminApp } from '@dineflow/app-admin';
import { GuestApp } from '@dineflow/app-guest';
import { Globe, Crown, Building2, Smartphone, ChevronUp, ChevronDown } from 'lucide-react';

export const App: React.FC = () => {
  // Resolve context from hostname, pathname, and URL search
  const tenantInfo = resolveTenant(
    window.location.hostname,
    window.location.pathname,
    window.location.search
  );

  const [activePanel, setActivePanel] = useState<ResolvedPanel>(tenantInfo.panel);
  const [activeHotelSlug, setActiveHotelSlug] = useState<string>(
    tenantInfo.hotelSlug || 'gusto'
  );
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Sync with browser URL changes if popstate
  useEffect(() => {
    const handlePopState = () => {
      const updated = resolveTenant(
        window.location.hostname,
        window.location.pathname,
        window.location.search
      );
      setActivePanel(updated.panel);
      if (updated.hotelSlug) setActiveHotelSlug(updated.hotelSlug);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToPanel = (panel: ResolvedPanel, hotelSlug: string = 'gusto') => {
    setActivePanel(panel);
    setActiveHotelSlug(hotelSlug);

    // Update query params quietly for clean bookmarking & sharing
    const url = new URL(window.location.href);
    if (panel === 'super_admin') {
      url.searchParams.set('panel', 'superadmin');
      url.searchParams.delete('hotel');
    } else if (panel === 'hotel_admin') {
      url.searchParams.set('panel', 'dashboard');
      url.searchParams.set('hotel', hotelSlug);
    } else if (panel === 'guest') {
      url.searchParams.delete('panel');
      url.searchParams.set('hotel', hotelSlug);
    } else {
      url.searchParams.delete('panel');
      url.searchParams.delete('hotel');
    }
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Active Application Render */}
      <div className="flex-1">
        {activePanel === 'landing' && (
          <LandingApp
            onNavigateToHotelAdmin={(slug) => navigateToPanel('hotel_admin', slug || 'gusto')}
            onNavigateToSuperAdmin={() => navigateToPanel('super_admin')}
            onNavigateToGuest={(slug) => navigateToPanel('guest', slug)}
          />
        )}

        {activePanel === 'super_admin' && (
          <SuperAdminApp
            onSwitchToHotelAdmin={(slug) => navigateToPanel('hotel_admin', slug)}
            onNavigateToLanding={() => navigateToPanel('landing')}
          />
        )}

        {activePanel === 'hotel_admin' && (
          <AdminApp
            initialHotelSlug={activeHotelSlug}
            onNavigateToGuest={(slug) => navigateToPanel('guest', slug)}
            onNavigateToSuperAdmin={() => navigateToPanel('super_admin')}
            onNavigateToLanding={() => navigateToPanel('landing')}
          />
        )}

        {activePanel === 'guest' && (
          <GuestApp hotelSlug={activeHotelSlug} />
        )}
      </div>

      {/* Floating Monorepo Panel & Subdomain Switcher */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-xs">
          <div
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="px-3 py-2 flex items-center justify-between gap-3 cursor-pointer bg-slate-800/80 hover:bg-slate-800 transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Monorepo Switcher: {activePanel.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {isSwitcherOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>

          {isSwitcherOpen && (
            <div className="p-3 space-y-2.5 max-w-xs">
              <p className="text-[10px] text-slate-400">
                Switch instantly between all 4 independent applications:
              </p>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => navigateToPanel('landing')}
                  className={`p-2 rounded-xl text-left flex items-center gap-2 transition cursor-pointer ${
                    activePanel === 'landing'
                      ? 'bg-orange-500 text-white font-bold'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Landing
                </button>

                <button
                  onClick={() => navigateToPanel('super_admin')}
                  className={`p-2 rounded-xl text-left flex items-center gap-2 transition cursor-pointer ${
                    activePanel === 'super_admin'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  Super Admin
                </button>

                <button
                  onClick={() => navigateToPanel('hotel_admin', activeHotelSlug)}
                  className={`p-2 rounded-xl text-left flex items-center gap-2 transition cursor-pointer ${
                    activePanel === 'hotel_admin'
                      ? 'bg-orange-500 text-white font-bold'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Hotel Admin
                </button>

                <button
                  onClick={() => navigateToPanel('guest', activeHotelSlug)}
                  className={`p-2 rounded-xl text-left flex items-center gap-2 transition cursor-pointer ${
                    activePanel === 'guest'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Guest Menu
                </button>
              </div>

              {/* Subdomain hotel selector */}
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  Active Hotel Subdomain:
                </span>
                <select
                  value={activeHotelSlug}
                  onChange={(e) => navigateToPanel(activePanel, e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none"
                >
                  <option value="gusto">gusto.localhost (Gusto Bistro)</option>
                  <option value="malabar">malabar.localhost (Malabar Coastal)</option>
                  <option value="paradise">paradise.localhost (Paradise Grill)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
