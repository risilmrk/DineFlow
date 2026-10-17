import React from 'react';
import { Clock, MapPin, Phone, Sparkles } from 'lucide-react';
import { Hotel } from '@dineflow/database';
import { Badge } from '@dineflow/ui';

interface GuestHeaderProps {
  hotel: Hotel;
}

export const GuestHeader: React.FC<GuestHeaderProps> = ({ hotel }) => {
  return (
    <header className="relative bg-slate-900 border-b border-slate-800">
      {/* Cover Image */}
      {hotel.cover_image_url && (
        <div className="h-44 sm:h-56 w-full relative overflow-hidden">
          <img
            src={hotel.cover_image_url}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>
      )}

      {/* Hotel Identity Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
          {hotel.logo_url ? (
            <img
              src={hotel.logo_url}
              alt={hotel.name}
              className="w-24 h-24 rounded-3xl object-cover border-4 border-slate-950 shadow-2xl bg-slate-900"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-orange-500/20 text-orange-400 font-extrabold text-2xl flex items-center justify-center border-4 border-slate-950 shadow-2xl">
              {hotel.name.charAt(0)}
            </div>
          )}

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                {hotel.name}
              </h1>
              <Badge variant="success" size="sm">
                Open Now
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              {hotel.tagline || 'Artisan Gastronomy & Seasonal Specialties'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1">
              {hotel.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" /> {hotel.address}
                </span>
              )}
              {hotel.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-orange-400" /> {hotel.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
