import React, { useState } from 'react';
import { Sliders, Check, Edit2, Sparkles, HardDrive, Shield, Users, UtensilsCrossed } from 'lucide-react';
import { SubscriptionPlan } from '@dineflow/database';
import { Button, Badge, Modal } from '@dineflow/ui';

interface PlansModuleProps {
  plans: SubscriptionPlan[];
  onUpdatePlan: (plan: SubscriptionPlan) => Promise<void>;
}

export const PlansModule: React.FC<PlansModuleProps> = ({ plans, onUpdatePlan }) => {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({});
  const [featureInput, setFeatureInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({ ...plan });
    setError(null);
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      const current = formData.features || [];
      setFormData({ ...formData, features: [...current, featureInput.trim()] });
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    const current = formData.features || [];
    setFormData({ ...formData, features: current.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      setIsSaving(true);
      await onUpdatePlan({
        ...editingPlan,
        ...formData,
      } as SubscriptionPlan);
      setIsSaving(false);
      setEditingPlan(null);
    } catch (err: any) {
      setIsSaving(false);
      setError(err.message || 'Error updating plan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Dynamic Subscription Plan Limits</h3>
          <p className="text-xs text-slate-400">
            Changes made here update the database instantly and dynamically apply across all hotel tenants.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden"
          >
            {plan.is_featured && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow">
                Most Popular
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white text-lg">{plan.name}</h4>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.description}</p>
              </div>

              <div className="py-2 border-y border-slate-800 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">${plan.monthly_price}</span>
                <span className="text-xs text-slate-400">/ month</span>
                <span className="text-xs text-slate-500 ml-auto">(${plan.yearly_price}/yr)</span>
              </div>

              {/* Numerical Quotas */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400" /> Max Food Items:
                  </span>
                  <span className="font-bold text-white">{plan.max_food_items} dishes</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-400" /> Max Staff Accounts:
                  </span>
                  <span className="font-bold text-white">{plan.max_staff_accounts} seats</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" /> Media Storage:
                  </span>
                  <span className="font-bold text-white">{plan.cloudinary_storage_mb} MB</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" /> API Rate Limit:
                  </span>
                  <span className="font-bold text-white">
                    {plan.api_access_enabled ? `${plan.api_rate_limit_rpm} RPM` : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Feature bullets */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Included Features:
                </p>
                {plan.features?.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <Button
                variant="secondary"
                size="sm"
                icon={Edit2}
                onClick={() => handleOpenEdit(plan)}
                className="w-full"
              >
                Edit Plan Quotas
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Plan Limits Edit Modal */}
      {editingPlan && (
        <Modal
          isOpen={true}
          onClose={() => setEditingPlan(null)}
          title={`Edit Quotas: ${editingPlan.name}`}
          description="Adjust pricing and hard system enforcement limits."
          maxWidth="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 rounded-xl text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Monthly Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.monthly_price ?? 0}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Max Food Items *</label>
                <input
                  type="number"
                  required
                  value={formData.max_food_items ?? 10}
                  onChange={(e) =>
                    setFormData({ ...formData, max_food_items: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Max Staff *</label>
                <input
                  type="number"
                  required
                  value={formData.max_staff_accounts ?? 2}
                  onChange={(e) =>
                    setFormData({ ...formData, max_staff_accounts: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Storage (MB) *</label>
                <input
                  type="number"
                  required
                  value={formData.cloudinary_storage_mb ?? 50}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cloudinary_storage_mb: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Rate Limit (RPM)</label>
                <input
                  type="number"
                  value={formData.api_rate_limit_rpm ?? 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      api_rate_limit_rpm: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Feature Flags */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.api_access_enabled ?? false}
                  onChange={(e) =>
                    setFormData({ ...formData, api_access_enabled: e.target.checked })
                  }
                  className="rounded bg-slate-800 border-slate-700 text-orange-500"
                />
                REST API Access Allowed
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.analytics_export_enabled ?? false}
                  onChange={(e) =>
                    setFormData({ ...formData, analytics_export_enabled: e.target.checked })
                  }
                  className="rounded bg-slate-800 border-slate-700 text-orange-500"
                />
                Analytics Export Allowed
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setEditingPlan(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Save Dynamic Limits
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
