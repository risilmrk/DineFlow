import React, { useState } from 'react';
import { Key, Plus, Trash2, Check, AlertCircle, Shield, Activity } from 'lucide-react';
import { ApiKey, HotelSubscription } from '@dineflow/database';
import { EntitlementService } from '@dineflow/core';
import { Button, Badge, StatCard } from '@dineflow/ui';
import { ApiKeyModal } from './ApiKeyModal';

interface ApiModuleProps {
  hotelId: string;
  apiKeys: ApiKey[];
  subscription: HotelSubscription | null;
  onCreateApiKey: (name: string) => Promise<string>;
  onRevokeApiKey: (keyId: string) => Promise<void>;
}

export const ApiModule: React.FC<ApiModuleProps> = ({
  hotelId,
  apiKeys,
  subscription,
  onCreateApiKey,
  onRevokeApiKey,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  const plan = EntitlementService.getEffectivePlan(subscription);
  const isApiAllowed = EntitlementService.isApiAccessAllowed(subscription);

  const handleCreate = async (name: string) => {
    const secret = await onCreateApiKey(name);
    setGeneratedSecret(secret);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGeneratedSecret(null);
  };

  return (
    <div className="space-y-6">
      {/* Rate Limits & Quota Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="API Access Feature"
          value={isApiAllowed ? 'Enabled' : 'Locked'}
          subtitle={isApiAllowed ? `${plan.name} Tier` : 'Requires Pro or Enterprise'}
          icon={Shield}
          variant={isApiAllowed ? 'emerald' : 'rose'}
        />
        <StatCard
          title="Rate Limit (RPM)"
          value={`${plan.api_rate_limit_rpm} req/min`}
          subtitle="Enforced sliding window"
          icon={Activity}
          variant="sky"
        />
        <StatCard
          title="Monthly Request Quota"
          value={`${plan.monthly_api_quota.toLocaleString()} req`}
          subtitle="Resets monthly on billing date"
          icon={Key}
          variant="purple"
        />
      </div>

      {!isApiAllowed && (
        <div className="p-4 bg-amber-950/70 border border-amber-800 rounded-2xl text-amber-200 text-xs flex items-center justify-between">
          <span>
            API access is not included in the current subscription plan. Upgrade to generate API keys
            and connect external systems.
          </span>
          <Badge variant="warning">Upgrade Required</Badge>
        </div>
      )}

      {/* API Keys Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">Active Secret API Keys</h3>
          <p className="text-xs text-slate-400">
            Authenticate POS integrations, self-service kiosks, and inventory connectors.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setGeneratedSecret(null);
            setIsModalOpen(true);
          }}
          disabled={!isApiAllowed}
        >
          Create Key
        </Button>
      </div>

      {/* Keys Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase">Key Name</th>
                <th className="py-3 px-4 font-semibold uppercase">Prefix</th>
                <th className="py-3 px-4 font-semibold uppercase">Created</th>
                <th className="py-3 px-4 font-semibold uppercase">Last Used</th>
                <th className="py-3 px-4 font-semibold uppercase">Status</th>
                <th className="py-3 px-4 font-semibold uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {apiKeys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-medium text-white">{k.name}</td>
                  <td className="py-3 px-4 font-mono text-orange-400">{k.key_prefix}••••••••</td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={k.is_active ? 'success' : 'danger'} size="sm">
                      {k.is_active ? 'Active' : 'Revoked'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {k.is_active && (
                      <button
                        onClick={() => onRevokeApiKey(k.id)}
                        className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {apiKeys.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            No API keys generated yet.
          </div>
        )}
      </div>

      {/* Code Integration Example */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
          REST API Authentication Example
        </h4>
        <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800">
{`# Retrieve public digital menu items via REST API
curl -X GET "https://dineflow.app/api/v1/hotels/${hotelId}/menu" \\
  -H "Authorization: Bearer df_live_YOUR_KEY_SECRET" \\
  -H "Content-Type: application/json"`}
        </pre>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        generatedSecret={generatedSecret}
        onCreateKey={handleCreate}
      />
    </div>
  );
};
