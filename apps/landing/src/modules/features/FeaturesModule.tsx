import React from 'react';
import {
  UtensilsCrossed,
  Coins,
  QrCode,
  Users,
  Key,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export const FeaturesModule: React.FC = () => {
  const features = [
    {
      icon: UtensilsCrossed,
      title: 'Digital Menu Showcase',
      description:
        'Display your dishes with high-res photos, allergens, dietary badges (vegan, gluten-free, halal), calories, and real-time out-of-stock toggling.',
      color: 'text-orange-400',
    },
    {
      icon: Coins,
      title: 'Hotel Ledger & Net Result',
      description:
        'Track cash drawer, POS terminals, and bank deposits. Formula: Net Operating Result = Income - Expenses with void audit tracking.',
      color: 'text-emerald-400',
    },
    {
      icon: QrCode,
      title: 'Table Tent QR Generator',
      description:
        'Generate high-resolution PNG QR codes and printable foldable table cards featuring your hotel logo and Wi-Fi credentials.',
      color: 'text-purple-400',
    },
    {
      icon: Users,
      title: 'Staff Invitations & Roles',
      description:
        'Invite head chefs, line cooks, floor managers, and cashiers with granular RBAC permissions. Quotas reserve seat allocation safely.',
      color: 'text-sky-400',
    },
    {
      icon: Key,
      title: 'REST API & Webhooks',
      description:
        'Seamlessly sync your catalog with front-desk POS terminals, kitchen display monitors, and accounting software.',
      color: 'text-amber-400',
    },
    {
      icon: Shield,
      title: 'Dynamic Subscription Limits',
      description:
        'Super Admin can reconfigure any tier limit on the fly without database downtime. Quotas are checked on every insertion.',
      color: 'text-rose-400',
    },
  ];

  return (
    <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center space-y-3 mb-16">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Everything Your Hospitality Brand Needs
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          A dedicated suite of modules designed to streamline hotel operations from guest discovery to accounting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                <Icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
