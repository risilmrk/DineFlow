import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  HotelMembership,
  StaffInvitation,
  HotelRole,
  HotelSubscription,
} from '@dineflow/database';
import { EntitlementService } from '@dineflow/core';
import { Button, Badge, StatCard } from '@dineflow/ui';
import { InviteStaffModal } from './InviteStaffModal';
import { RolePermissionsMatrix } from './RolePermissionsMatrix';

interface StaffModuleProps {
  hotelId: string;
  memberships: HotelMembership[];
  invitations: StaffInvitation[];
  roles: HotelRole[];
  subscription: HotelSubscription | null;
  onSendInvitation: (email: string, roleId: string) => Promise<void>;
  onRevokeInvitation: (invitationId: string) => Promise<void>;
  onRemoveMembership: (membershipId: string) => Promise<void>;
}

export const StaffModule: React.FC<StaffModuleProps> = ({
  hotelId,
  memberships,
  invitations,
  roles,
  subscription,
  onSendInvitation,
  onRevokeInvitation,
  onRemoveMembership,
}) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const pendingInvites = invitations.filter((i) => i.status === 'pending');
  const quota = EntitlementService.checkStaffQuota(
    memberships.length,
    pendingInvites.length,
    subscription
  );

  return (
    <div className="space-y-6">
      {/* Quota & Capacity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Team Members"
          value={memberships.length}
          subtitle="Registered staff accounts"
          icon={Users}
          variant="sky"
        />
        <StatCard
          title="Pending Invitations"
          value={pendingInvites.length}
          subtitle="Reserved quota slots"
          icon={Clock}
          variant="orange"
        />
        <StatCard
          title="Plan Staff Limit"
          value={`${quota.currentCount} / ${quota.maxLimit}`}
          subtitle={`${quota.remaining} slots remaining`}
          icon={Shield}
          variant={quota.allowed ? 'emerald' : 'rose'}
        />
      </div>

      {/* Staff Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">Hotel Staff & Team Accounts</h3>
          <p className="text-xs text-slate-400">
            Control access roles, invite cooks, managers, and service crew.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={UserPlus}
          onClick={() => setIsInviteModalOpen(true)}
          disabled={!quota.allowed}
        >
          Invite Staff
        </Button>
      </div>

      {/* Active Members Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
            Active Staff ({memberships.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase">Staff Member</th>
                <th className="py-3 px-4 font-semibold uppercase">Role</th>
                <th className="py-3 px-4 font-semibold uppercase">Status</th>
                <th className="py-3 px-4 font-semibold uppercase">Joined Date</th>
                <th className="py-3 px-4 font-semibold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {memberships.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <p className="font-medium text-white">
                      {m.profile?.full_name || 'Staff User'}
                    </p>
                    <p className="text-slate-400 text-[11px]">{m.profile?.email || 'N/A'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="purple" size="sm">
                      {m.role?.name || 'Staff'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onRemoveMembership(m.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
                      title="Remove from hotel team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {memberships.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            No active staff accounts yet.
          </div>
        )}
      </div>

      {/* Pending Invitations Table */}
      {pendingInvites.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/40">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
              Pending Invitations ({pendingInvites.length})
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase">Invited Email</th>
                  <th className="py-3 px-4 font-semibold uppercase">Assigned Role</th>
                  <th className="py-3 px-4 font-semibold uppercase">Status</th>
                  <th className="py-3 px-4 font-semibold uppercase">Expires At</th>
                  <th className="py-3 px-4 font-semibold uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingInvites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-medium text-white">{inv.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="info" size="sm">
                        {inv.role?.name || 'Staff'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="warning" size="sm">
                        Pending
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onRevokeInvitation(inv.id)}
                        className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions Matrix */}
      <RolePermissionsMatrix roles={roles} />

      {/* Invite Modal */}
      <InviteStaffModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        roles={roles}
        currentStaffCount={memberships.length}
        pendingInvitationsCount={pendingInvites.length}
        subscription={subscription}
        onSendInvite={onSendInvitation}
      />
    </div>
  );
};
