import React, { useState } from 'react';
import { Mail, Shield, UserPlus } from 'lucide-react';
import { HotelSubscription, HotelRole } from '@dineflow/database';
import { Modal, Button } from '@dineflow/ui';
import { EntitlementService } from '@dineflow/core';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: HotelRole[];
  currentStaffCount: number;
  pendingInvitationsCount: number;
  subscription: HotelSubscription | null;
  onSendInvite: (email: string, roleId: string) => Promise<void>;
}

export const InviteStaffModal: React.FC<InviteStaffModalProps> = ({
  isOpen,
  onClose,
  roles,
  currentStaffCount,
  pendingInvitationsCount,
  subscription,
  onSendInvite,
}) => {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState(roles[0]?.id || '');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quota = EntitlementService.checkStaffQuota(
    currentStaffCount,
    pendingInvitationsCount,
    subscription
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid staff email address.');
      return;
    }
    if (!quota.allowed) {
      setError(quota.message || 'Staff quota exceeded');
      return;
    }

    try {
      setIsSending(true);
      await onSendInvite(email.trim().toLowerCase(), roleId || roles[0]?.id);
      setIsSending(false);
      setEmail('');
      onClose();
    } catch (err: any) {
      setIsSending(false);
      setError(err.message || 'Error sending invitation');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Staff Member"
      description="Send a role-based invitation. Invited accounts count against plan quota until accepted or revoked."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Staff Account Allocation:</span>
          <span className="font-semibold text-white">
            {quota.currentCount} / {quota.maxLimit} used ({quota.remaining} slots remaining)
          </span>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Staff Email Address *</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. marco.chef@gustobistro.com"
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Assign Role *</label>
          <select
            value={roleId || roles[0]?.id}
            onChange={(e) => setRoleId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.description || 'Hotel team member'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={UserPlus}
            isLoading={isSending}
            disabled={!quota.allowed}
          >
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
