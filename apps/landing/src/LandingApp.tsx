import React, { useState, useEffect } from 'react';
import {
  Building2,
  ExternalLink,
  ChevronRight,
  Shield,
  Sparkles,
  ArrowRight,
  Plus,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import { SubscriptionPlan, Hotel, UserProfile, supabase } from '@dineflow/database';
import { Button, Badge } from '@dineflow/ui';
import { HeroModule } from './modules/hero/HeroModule';
import { FeaturesModule } from './modules/features/FeaturesModule';
import { PricingModule } from './modules/pricing/PricingModule';
import { DocsModule } from './modules/docs/DocsModule';
import { LoginModal } from '../../../src/components/auth/LoginModal';
import { CreateHotelModal } from '../../../src/components/hotel/CreateHotelModal';

export interface LandingAppProps {
  onNavigateToHotelAdmin?: (slug?: string) => void;
  onNavigateToSuperAdmin?: () => void;
  onNavigateToGuest?: (slug: string) => void;
  currentUser?: UserProfile | null;
  onSignOut?: () => void;
  onSelectDemoUser?: (persona: 'hotel_owner' | 'hotel_manager' | 'super_admin') => void;
}

export const LandingApp: React.FC<LandingAppProps> = ({
  onNavigateToHotelAdmin,
  onNavigateToSuperAdmin,
  onNavigateToGuest,
  currentUser,
  onSignOut,
  onSelectDemoUser,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateHotelOpen, setIsCreateHotelOpen] = useState(false);

  const loadLandingData = async () => {
    try {
      setLoading(true);
      const [plansRes, hotelsRes] = await Promise.all([
        supabase.from('subscription_plans').select('*').order('sort_order'),
        supabase.from('hotels').select('*').order('name'),
      ]);

      if (plansRes.data) setPlans(plansRes.data);
      if (hotelsRes.data) setHotels(hotelsRes.data);
    } catch (err) {
      console.error('Error fetching landing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLandingData();
  }, []);

  const handleExploreDemo = () => {
    if (onNavigateToGuest) {
      onNavigateToGuest('gusto');
    }
  };

  const handleScrollToPricing = () => {
    const el = document.getElementById('pricing');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleHotelCreated = (newHotel: { id: string; name: string; slug: string }) => {
    loadLandingData();
    if (onNavigateToHotelAdmin) {
      onNavigateToHotelAdmin(newHotel.slug);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
              D
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white font-serif">
              DineFlow
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#pricing" className="hover:text-white transition">
              Pricing & Quotas
            </a>
            <a href="#docs" className="hover:text-white transition">
              REST API
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Create Hotel Button */}
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => setIsCreateHotelOpen(true)}
              className="border-orange-500/40 text-orange-400 hover:text-white"
            >
              Create Hotel
            </Button>

            {/* Auth / Profile display */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name || ''}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-orange-400">
                    {(currentUser.full_name || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-slate-200 hidden sm:inline max-w-[120px] truncate">
                  {currentUser.full_name || currentUser.email}
                </span>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                icon={LogIn}
                onClick={() => setIsLoginModalOpen(true)}
              >
                Sign In
              </Button>
            )}

            {/* Admin Console Link */}
            {onNavigateToHotelAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateToHotelAdmin('gusto')}
              >
                Hotel Admin Console
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <HeroModule
          onExploreDemo={handleExploreDemo}
          onViewPricing={handleScrollToPricing}
        />

        {/* Live Hotel Subdomain Showcase */}
        <section className="py-12 bg-slate-900/30 border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Subdomain-Isolated Live Guest Menus
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any hotel to experience its responsive guest digital menu
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setIsCreateHotelOpen(true)}
              >
                Create Your Hotel
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {hotels.map((h) => (
                <div
                  key={h.id}
                  onClick={() => onNavigateToGuest && onNavigateToGuest(h.slug)}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 hover:shadow-xl transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    {h.logo_url ? (
                      <img
                        src={h.logo_url}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center">
                        {h.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white text-sm group-hover:text-orange-400 transition">
                        {h.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400">{h.slug}.localhost:5173</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <FeaturesModule />

        <PricingModule
          plans={plans}
          onSelectPlan={() => setIsCreateHotelOpen(true)}
        />

        <DocsModule />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-white text-sm">DineFlow SaaS</span>
            <span>— Multi-Tenant Hotel Digital Menu Platform</span>
          </div>
          <p>© 2026 DineFlow Platform Inc. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal with Google OAuth */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSelectDemoUser={onSelectDemoUser}
      />

      {/* Create Hotel by Users Modal */}
      <CreateHotelModal
        isOpen={isCreateHotelOpen}
        onClose={() => setIsCreateHotelOpen(false)}
        plans={plans}
        onHotelCreated={handleHotelCreated}
      />
    </div>
  );
};
