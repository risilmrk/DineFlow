import React from 'react';
import { Printer, X } from 'lucide-react';
import { Hotel } from '@dineflow/database';
import { Modal, Button } from '@dineflow/ui';

interface TentCardPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: Hotel;
  qrDataUrl: string;
}

export const TentCardPreview: React.FC<TentCardPreviewProps> = ({
  isOpen,
  onClose,
  hotel,
  qrDataUrl,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Table Tent Card"
      description="Foldable table tent card designed for tables, counters, and bar tops."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Printable Card Area */}
        <div
          id="printable-tent-card"
          className="bg-white text-slate-900 rounded-2xl p-8 border border-slate-200 shadow-xl text-center space-y-4 max-w-sm mx-auto"
        >
          {hotel.logo_url && (
            <img
              src={hotel.logo_url}
              alt={hotel.name}
              className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-slate-900"
            />
          )}
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
              {hotel.name}
            </h2>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-medium mt-1">
              {hotel.tagline || 'Artisan Digital Dining'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 inline-block">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="Table QR Code" className="w-48 h-48 mx-auto" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">Scan to View Our Digital Menu</p>
            <p className="text-xs text-slate-500">
              Point your phone camera at the QR code. No app download required.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-400">
            Powered by DineFlow SaaS Platform
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" variant="primary" icon={Printer} onClick={handlePrint}>
            Print Card
          </Button>
        </div>
      </div>
    </Modal>
  );
};
