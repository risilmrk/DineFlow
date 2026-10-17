import React, { useState } from 'react';
import { Check, Sparkles, UtensilsCrossed, Users, HardDrive, Shield } from 'lucide-react';
import { SubscriptionPlan } from '@dineflow/database';
import { Badge, Button } from '@dineflow/ui';

interface PricingModuleProps {
  plans: SubscriptionPlan[];
  onSelectPlan?: (plan: SubscriptionPlan) => void;
}

export const PricingModule: React.FC<PricingModuleProps> = ({ plans, onSelectPlan }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <section id="pricing" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4 mb-12">
        <Badge variant="purple" size="md">
          Dynamic Database Pricing
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Transparent, Scalable Hospitality Plans
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          All tier limits and quotas are synchronized in real-time with the database. Upgrade or
          change anytime with zero downtime.
        </p>

        {/* Toggle Billing Period */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span
            className={`text-xs font-semibold ${
              billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setBillingCycle((prev) => (prev === 'monthly' ? 'yearly' : 'monthly'))
            }
            className="w-12 h-6 rounded-full bg-slate-800 p-1 relative transition border border-slate-700"
          >
            <div
              className={`w-4 h-4 rounded-full bg-orange-500 transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`text-xs font-semibold flex items-center gap-1.5 ${
              billingCycle === 'yearly' ? 'text-white' : 'text-slate-400'
            }`}
          >
            Annual Billing
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Save ~17%
            </span>
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const price =
            billingCycle === 'yearly' ? Math.round(plan.yearly_price / 12) : plan.monthly_price;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative transition hover:-translate-y-1 ${
                plan.is_featured
                  ? 'bg-slate-900 border-2 border-orange-500 shadow-orange-500/10'
                  : 'bg-slate-900/80 border border-slate-800'
              }`}
            >
              {plan.is_featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">${price}</span>
                  <span className="text-slate-400 text-xs">/ month</span>
                  {billingCycle === 'yearly' && (
                    <span className="text-[11px] text-slate-400 ml-auto">
                      Billed ${plan.yearly_price}/yr
                    </span>
                  )}
                </div>

                {/* Quotas */}
                <div className="space-y-2.5 py-4 border-y border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-orange-400" /> Max Food Items:
                    </span>
                    <span className="font-bold text-white">{plan.max_food_items} dishes</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-400" /> Max Staff Accounts:
                    </span>
                    <span className="font-bold text-white">{plan.max_staff_accounts} accounts</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-purple-400" /> Cloudinary Media:
                    </span>
                    <span className="font-bold text-white">{plan.cloudinary_storage_mb} MB</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" /> REST API Access:
                    </span>
                    <span className="font-bold text-white">
                      {plan.api_access_enabled ? `${plan.api_rate_limit_rpm} req/min` : 'Not Included'}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Plan Capabilities:
                  </p>
                  {plan.features?.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Button
                  variant={plan.is_featured ? 'primary' : 'secondary'}
                  size="lg"
                  className="w-full"
                  onClick={() => onSelectPlan && onSelectPlan(plan)}
                >
                  Get Started with {plan.name}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
