import React from 'react';
import { ArrowRight, Sparkles, QrCode, ShieldCheck, Zap } from 'lucide-react';
import { Button, Badge } from '@dineflow/ui';

interface HeroModuleProps {
  onExploreDemo: () => void;
  onViewPricing: () => void;
}

export const HeroModule: React.FC<HeroModuleProps> = ({ onExploreDemo, onViewPricing }) => {
  return (
    <section className="relative pt-24 pb-20 overflow-hidden text-center">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Production Multi-Tenant SaaS for Premium Hospitality
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
          The Digital Menu Platform <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 font-serif italic">
            Built for Culinary Excellence
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Subdomain-isolated guest menus, cash & bank ledger accounting, live table tent QR codes,
          and dynamic plan quotas — crafted for luxury hotels and artisan restaurants.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button variant="primary" size="lg" icon={ArrowRight} onClick={onExploreDemo}>
            Explore Live Hotel Demo
          </Button>
          <Button variant="outline" size="lg" onClick={onViewPricing}>
            View Subscription Pricing
          </Button>
        </div>

        {/* Feature Highlights Pills */}
        <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <QrCode className="w-5 h-5 text-orange-400 mb-2" />
            <h4 className="font-semibold text-white text-xs">Instant QR Resolution</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Subdomain-based tenant routing</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <Zap className="w-5 h-5 text-amber-400 mb-2" />
            <h4 className="font-semibold text-white text-xs">Sub-second Loading</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Zero cart bloat, digital menu only</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
            <h4 className="font-semibold text-white text-xs">Row-Level Security</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">PostgreSQL strict tenant isolation</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <Sparkles className="w-5 h-5 text-purple-400 mb-2" />
            <h4 className="font-semibold text-white text-xs">Dynamic Quota Engine</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time DB limit enforcement</p>
          </div>
        </div>
      </div>
    </section>
  );
};
