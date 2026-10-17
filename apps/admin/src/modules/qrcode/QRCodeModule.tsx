import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Printer,
  Copy,
  ExternalLink,
  Check,
  Smartphone,
} from 'lucide-react';
import { Hotel } from '@dineflow/database';
import { Button, Badge } from '@dineflow/ui';
import { buildHotelGuestUrl, buildHotelPreviewUrl } from '@dineflow/core';
import { TentCardPreview } from './TentCardPreview';

interface QRCodeModuleProps {
  hotel: Hotel;
}

export const QRCodeModule: React.FC<QRCodeModuleProps> = ({ hotel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isTentCardOpen, setIsTentCardOpen] = useState(false);

  const guestUrl = buildHotelGuestUrl(hotel.slug);
  const previewUrl = buildHotelPreviewUrl(hotel.slug);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        guestUrl,
        {
          width: 280,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (!error && canvasRef.current) {
            setQrDataUrl(canvasRef.current.toDataURL('image/png'));
          }
        }
      );
    }
  }, [hotel.slug, guestUrl]);

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${hotel.slug}_table_qr.png`;
    a.click();
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
          {/* Canvas & QR container */}
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-2xl shadow-2xl border border-slate-200">
              <canvas ref={canvasRef} className="rounded-lg" />
            </div>

            <div className="flex items-center gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleDownloadPng}
                className="flex-1"
              >
                PNG Image
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={() => setIsTentCardOpen(true)}
                className="flex-1"
              >
                Tent Card
              </Button>
            </div>
          </div>

          {/* Details & Live Preview Links */}
          <div className="flex-1 space-y-5 text-center lg:text-left">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <Badge variant="purple" size="sm">
                  Subdomain QR
                </Badge>
                <Badge variant="success" size="sm">
                  Instant Load
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Guest Digital Menu Access Point
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Guests scan this QR code with their mobile cameras to view the live, mobile-first
                digital menu for <strong>{hotel.name}</strong> without installing an app or registering.
              </p>
            </div>

            {/* Resolved Subdomain Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Resolved Guest Subdomain URL
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={guestUrl}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={copied ? Check : Copy}
                  onClick={handleCopyUrl}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <a
                  href={guestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="Open live guest page"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-[11px] text-slate-400">
                Fallback Query Link: <code className="text-orange-400">{previewUrl}</code>
              </p>
            </div>

            {/* Usage Tips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <p className="font-semibold text-white">Table Standees</p>
                <p className="text-slate-400 mt-0.5">
                  Print acrylic stands or table cards so patrons can scan as soon as they sit.
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <p className="font-semibold text-white">Bar & Entrance Counter</p>
                <p className="text-slate-400 mt-0.5">
                  Display at host podiums and bar stools for fast drink and food browsing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tent Card Preview Modal */}
      <TentCardPreview
        isOpen={isTentCardOpen}
        onClose={() => setIsTentCardOpen(false)}
        hotel={hotel}
        qrDataUrl={qrDataUrl}
      />
    </div>
  );
};
