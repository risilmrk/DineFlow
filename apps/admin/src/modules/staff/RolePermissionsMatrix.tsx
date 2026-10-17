import React from 'react';
import { ShieldCheck, Check, X } from 'lucide-react';
import { HotelRole } from '@dineflow/database';

interface RolePermissionsMatrixProps {
  roles: HotelRole[];
}

export const RolePermissionsMatrix: React.FC<RolePermissionsMatrixProps> = ({ roles }) => {
  const permissionsList = [
    { key: 'menu:view', label: 'View Digital Menu' },
    { key: 'menu:manage', label: 'Create & Edit Dishes / Prices' },
    { key: 'accounting:view', label: 'View Financial Summary' },
    { key: 'accounting:manage', label: 'Record Transactions & Accounts' },
    { key: 'accounting:void', label: 'Void Ledger Transactions' },
    { key: 'staff:manage', label: 'Invite & Manage Team Roles' },
    { key: 'api:manage', label: 'Create & Rotate API Keys' },
    { key: 'settings:manage', label: 'Edit Hotel Profile & Branding' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-orange-400" />
        <h3 className="font-semibold text-white text-sm">Role & Security Privileges</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Permission Capability</th>
              {roles.map((r) => (
                <th key={r.id} className="py-2.5 px-3 font-semibold text-center capitalize">
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {permissionsList.map((perm) => (
              <tr key={perm.key} className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 text-slate-300 font-medium">{perm.label}</td>
                {roles.map((r) => {
                  const hasPerm =
                    r.slug === 'hotel_admin' ||
                    (r.permissions && r.permissions.includes(perm.key)) ||
                    (r.slug === 'manager' && !perm.key.includes('void')) ||
                    (r.slug === 'chef' && perm.key.startsWith('menu:')) ||
                    (r.slug === 'waiter' && perm.key === 'menu:view');

                  return (
                    <td key={r.id} className="py-2.5 px-3 text-center">
                      {hasPerm ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800/60 text-slate-600">
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
