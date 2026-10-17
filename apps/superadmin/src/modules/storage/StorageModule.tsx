import React from 'react';
import { HardDrive, Image, CheckCircle, ExternalLink } from 'lucide-react';
import { MediaAsset, Hotel } from '@dineflow/database';
import { StatCard, Badge } from '@dineflow/ui';

interface StorageModuleProps {
  assets: MediaAsset[];
  hotels: Hotel[];
}

export const StorageModule: React.FC<StorageModuleProps> = ({ assets, hotels }) => {
  const totalBytes = assets.reduce((acc, a) => acc + (a.bytes || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Cloudinary Total Used"
          value={`${totalMB} MB`}
          subtitle="Across all hotel tenants"
          icon={HardDrive}
          variant="purple"
        />
        <StatCard
          title="Total Media Assets"
          value={assets.length}
          subtitle="Dish photos, logos, banners"
          icon={Image}
          variant="sky"
        />
        <StatCard
          title="Global CDN Status"
          value="Operational"
          subtitle="Auto-webp & on-the-fly resizing"
          icon={CheckCircle}
          variant="emerald"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-white text-sm">Recent Uploaded Media Assets</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {assets.slice(0, 18).map((asset) => {
            const hotel = hotels.find((h) => h.id === asset.hotel_id);
            return (
              <div
                key={asset.id}
                className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group relative"
              >
                <div className="h-28 overflow-hidden">
                  <img
                    src={asset.secure_url || asset.url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <div className="p-2 space-y-0.5 text-[10px]">
                  <p className="font-semibold text-white truncate">{hotel?.name || 'Hotel Asset'}</p>
                  <p className="text-slate-400">{(asset.bytes / 1024).toFixed(0)} KB • {asset.format}</p>
                </div>
              </div>
            );
          })}
        </div>

        {assets.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            No media assets uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
};
