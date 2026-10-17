import React, { useState } from 'react';
import {
  UtensilsCrossed,
  ShieldAlert,
  LayoutDashboard,
  Smartphone,
  ExternalLink,
  ChevronDown,
  UserCheck,
  Flame,
  FileCode,
} from 'lucide-react';
import { useAuth, UserPersona } from '../context/AuthContext';
import { ResolvedPanel } from '../lib/tenantResolver';

interface NavbarProps {
  currentPanel: ResolvedPanel;
  onSelectPanel: (panel: ResolvedPanel, hotelSlug?: string) => void;
  currentHotelSlug?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPanel,
  onSelectPanel,
  currentHotelSlug = 'gusto',
}) => {
  const { activePersona, switchPersona } = useAuth();
  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const hotels = [
    { name: 'Gusto Italian Bistro', slug: 'gusto', tag: 'Pro Plan' },
    { name: 'Malabar Coastal Kitchen', slug: 'malabar', tag: 'Enterprise' },
    { name: 'Paradise Grill & Lounge', slug: 'paradise', tag: 'Base Plan' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onSelectPanel('landing')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-950/40 group-hover:scale-105 transition">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-lg font-bold tracking-tight text-white">DineFlow</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                SaaS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 font-sans">Multi-Tenant Platform</p>
          </div>
        </div>

        {/* 4 Distinct Panel Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
          <button
            onClick={() => onSelectPanel('landing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              currentPanel === 'landing'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>Landing</span>
          </button>

          <button
            onClick={() => onSelectPanel('super_admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              currentPanel === 'super_admin'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </button>

          <button
            onClick={() => onSelectPanel('hotel_admin', currentHotelSlug || 'gusto')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              currentPanel === 'hotel_admin'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Hotel Admin</span>
          </button>

          {/* Guest Menus Dropdown */}
          <div className="relative">
            <button
              onClick={() => setGuestDropdownOpen(!guestDropdownOpen)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                currentPanel === 'guest'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Guest Menus</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {guestDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setGuestDropdownOpen(false)}
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Select Hotel Subdomain
                </div>
                {hotels.map((h) => (
                  <button
                    key={h.slug}
                    onClick={() => {
                      onSelectPanel('guest', h.slug);
                      setGuestDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                      currentPanel === 'guest' && currentHotelSlug === h.slug
                        ? 'bg-orange-500/10 text-orange-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white">{h.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{h.slug}.localhost:5173</div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {h.tag}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right Section: Persona Role Switcher & Subdomain Direct Link */}
        <div className="flex items-center gap-2.5">
          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition"
              title="Switch user identity for testing roles"
            >
              <UserCheck className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Role:</span>
              <span className="text-white font-semibold capitalize">
                {activePersona.replace('_', ' ')}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {personaDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setPersonaDropdownOpen(false)}
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Switch Active Persona
                </div>
                {[
                  {
                    id: 'super_admin' as UserPersona,
                    label: 'Platform Super Admin',
                    sub: 'Full access to all hotels & plans',
                  },
                  {
                    id: 'hotel_owner' as UserPersona,
                    label: 'Hotel Owner (Gusto)',
                    sub: 'Manage menu, staff & accounting',
                  },
                  {
                    id: 'hotel_manager' as UserPersona,
                    label: 'Hotel Manager (Malabar)',
                    sub: 'Menu & operational expenses',
                  },
                  {
                    id: 'guest' as UserPersona,
                    label: 'Guest Diner (Public)',
                    sub: 'Read-only public digital menu',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      switchPersona(item.id);
                      setPersonaDropdownOpen(false);
                      if (item.id === 'super_admin') onSelectPanel('super_admin');
                      else if (item.id === 'hotel_owner' || item.id === 'hotel_manager')
                        onSelectPanel('hotel_admin', item.id === 'hotel_owner' ? 'gusto' : 'malabar');
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition ${
                      activePersona === item.id
                        ? 'bg-orange-600/20 text-orange-400 font-semibold border border-orange-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-medium text-white">{item.label}</div>
                    <div className="text-[10px] text-slate-400">{item.sub}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subdomain Testing Quick Link */}
          {currentPanel === 'guest' && currentHotelSlug && (
            <a
              href={`http://${currentHotelSlug}.localhost:5173`}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-xs font-medium transition"
              title="Open via real local subdomain in new tab"
            >
              <span>Subdomain</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
