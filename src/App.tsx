import React, { useState, useEffect } from 'react';
import { resolveTenant, ResolvedPanel } from '@dineflow/core';
import { LandingApp } from '@dineflow/app-landing';
import { SuperAdminApp } from '@dineflow/app-superadmin';
import { AdminApp } from '@dineflow/app-admin';
import { GuestApp } from '@dineflow/app-guest';
import { Globe, Crown, Building2, Smartphone, ChevronUp, ChevronDown, Plus, LogIn, ChefHat } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginModal } from './components/auth/LoginModal';
import { CreateHotelModal } from './components/hotel/CreateHotelModal';
import { WaiterPanel } from './panels/WaiterPanel';
import { SubscriptionPlan, supabase } from '@dineflow/database';

const MainAppContent: React.FC = () => {
  const { user, signOut, switchPersona, userHotels, refreshUserHotels } = useAuth();

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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateHotelModalOpen, setIsCreateHotelModalOpen] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  // Fetch plans for create hotel modal
  useEffect(() => {
    supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        if (data) setPlans(data);
      });
  }, []);

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
    } else if (panel === 'waiter') {
      url.searchParams.set('panel', 'waiter');
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

  const handleHotelCreated = async (newHotel: { id: string; name: string; slug: string }) => {
    await refreshUserHotels();
    navigateToPanel('hotel_admin', newHotel.slug);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Active Application Render */}
      <div className="flex-1">
        {activePanel === 'landing' && (
          <LandingApp
            onNavigateToHotelAdmin={(slug) => navigateToPanel('hotel_admin', slug || activeHotelSlug)}
            onNavigateToSuperAdmin={() => navigateToPanel('super_admin')}
            onNavigateToGuest={(slug) => navigateToPanel('guest', slug)}
            currentUser={user}
            onSignOut={signOut}
            onSelectDemoUser={switchPersona}
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

        {activePanel === 'waiter' && (
          <WaiterPanel
            hotelSlug={activeHotelSlug}
            onNavigateToHotelAdmin={(slug) => navigateToPanel('hotel_admin', slug)}
            onNavigateToGuest={(slug) => navigateToPanel('guest', slug)}
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
            className="px-3.5 py-2 flex items-center justify-between gap-3 cursor-pointer bg-slate-800/80 hover:bg-slate-800 transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                DineFlow Launcher: {activePanel.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {isSwitcherOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>

          {isSwitcherOpen && (
            <div className="p-3 space-y-3 max-w-xs">
              {/* Quick Actions: Create Hotel & Login */}
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <button
                  onClick={() => setIsCreateHotelModalOpen(true)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition flex items-center justify-center gap-1 shadow cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Hotel
                </button>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition flex items-center gap-1 cursor-pointer border border-slate-700"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </button>
              </div>

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
                  onClick={() => navigateToPanel('waiter', activeHotelSlug)}
                  className={`p-2 rounded-xl text-left flex items-center gap-2 transition cursor-pointer ${
                    activePanel === 'waiter'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  Waiter Station
                </button>

                <button
                  onClick={() => navigateToPanel('guest', activeHotelSlug)}
                  className={`col-span-2 p-2 rounded-xl text-left flex items-center justify-center gap-2 transition cursor-pointer ${
                    activePanel === 'guest'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Guest Self-Ordering Menu
                </button>
              </div>

              {/* Subdomain hotel selector */}
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Active Hotel Tenant:
                  </span>
                  <span className="text-[10px] text-orange-400 font-mono">
                    {activeHotelSlug}.localhost
                  </span>
                </div>
                <select
                  value={activeHotelSlug}
                  onChange={(e) => navigateToPanel(activePanel, e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none"
                >
                  {userHotels.map((h) => (
                    <option key={h.id} value={h.slug}>
                      {h.name} ({h.slug})
                    </option>
                  ))}
                  {userHotels.length === 0 && (
                    <>
                      <option value="gusto">Gusto Bistro (gusto)</option>
                      <option value="malabar">Malabar Coastal (malabar)</option>
                      <option value="paradise">Paradise Grill (paradise)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login with Google Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSelectDemoUser={switchPersona}
      />

      {/* Self-serve Create Hotel Modal */}
      <CreateHotelModal
        isOpen={isCreateHotelModalOpen}
        onClose={() => setIsCreateHotelModalOpen(false)}
        plans={plans}
        onHotelCreated={handleHotelCreated}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};
