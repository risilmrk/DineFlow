import React, { useState } from 'react';
import {
  LayoutGrid,
  Plus,
  QrCode,
  Users,
  BellRing,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  ExternalLink,
  Printer,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Hotel, HotelTable, TableStatus, supabase } from '@dineflow/database';
import { Badge, Modal } from '@dineflow/ui';
import QRCode from 'qrcode';

interface TablesModuleProps {
  hotel: Hotel;
  tables: HotelTable[];
  onRefreshTables: () => void;
}

export const TablesModule: React.FC<TablesModuleProps> = ({
  hotel,
  tables,
  onRefreshTables,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<HotelTable | null>(null);
  const [qrModalTable, setQrModalTable] = useState<HotelTable | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Form State
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [section, setSection] = useState('Main Dining');
  const [status, setStatus] = useState<TableStatus>('available');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Extract unique sections
  const sections = Array.from(new Set(tables.map((t) => t.section || 'Main Dining')));

  const filteredTables = tables.filter((t) => {
    if (selectedSection === 'all') return true;
    return (t.section || 'Main Dining') === selectedSection;
  });

  // Summary counts
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const callingCount = tables.filter((t) => t.status === 'calling_waiter').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;

  const handleOpenAdd = () => {
    setEditingTable(null);
    setTableNumber(`T-${(tables.length + 1).toString().padStart(2, '0')}`);
    setCapacity('4');
    setSection(sections[0] || 'Main Dining');
    setStatus('available');
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (t: HotelTable) => {
    setEditingTable(t);
    setTableNumber(t.table_number);
    setCapacity(t.capacity.toString());
    setSection(t.section || 'Main Dining');
    setStatus(t.status);
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);
    try {
      if (!tableNumber.trim()) {
        setErrorMsg('Table number / name is required');
        setSaving(false);
        return;
      }

      if (editingTable) {
        const { error } = await supabase
          .from('hotel_tables')
          .update({
            table_number: tableNumber.trim(),
            capacity: parseInt(capacity, 10) || 4,
            section: section.trim() || 'Main Dining',
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTable.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('hotel_tables').insert({
          hotel_id: hotel.id,
          table_number: tableNumber.trim(),
          capacity: parseInt(capacity, 10) || 4,
          section: section.trim() || 'Main Dining',
          status,
        });

        if (error) throw error;
      }

      setIsAddModalOpen(false);
      onRefreshTables();
    } catch (err: any) {
      console.error('Error saving table:', err);
      setErrorMsg(err.message || 'Failed to save table');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to remove this table?')) return;
    try {
      const { error } = await supabase.from('hotel_tables').delete().eq('id', tableId);
      if (error) throw error;
      onRefreshTables();
    } catch (err) {
      console.error('Error deleting table:', err);
      alert('Could not delete table');
    }
  };

  const handleUpdateStatus = async (tableId: string, newStatus: TableStatus) => {
    try {
      const { error } = await supabase
        .from('hotel_tables')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', tableId);

      if (error) throw error;
      onRefreshTables();
    } catch (err) {
      console.error('Error updating table status:', err);
    }
  };

  const handleOpenQRModal = async (t: HotelTable) => {
    setQrModalTable(t);
    const guestUrl = `${window.location.origin}/?hotel=${hotel.slug}&table=${encodeURIComponent(
      t.table_number
    )}`;
    try {
      const url = await QRCode.toDataURL(guestUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-orange-500" />
            Floor & Tables Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage restaurant dining rooms, generate table-specific QR codes, and monitor live table occupancy.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Table
        </button>
      </div>

      {/* Live Floor Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{availableCount}</div>
            <div className="text-[11px] font-medium text-slate-400">Available Tables</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{occupiedCount}</div>
            <div className="text-[11px] font-medium text-slate-400">Occupied</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="text-lg font-bold text-amber-400">{callingCount}</div>
            <div className="text-[11px] font-medium text-slate-400">Calling Waiter</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{reservedCount}</div>
            <div className="text-[11px] font-medium text-slate-400">Reserved</div>
          </div>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedSection('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
            selectedSection === 'all'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Sections ({tables.length})
        </button>
        {sections.map((sec) => {
          const count = tables.filter((t) => (t.section || 'Main Dining') === sec).length;
          return (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                selectedSection === sec
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sec} ({count})
            </button>
          );
        })}
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center">
          <LayoutGrid className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Tables Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Add your dining room, terrace, bar, and VIP tables to enable QR self-ordering and waiter call features.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
          >
            Create First Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((t) => {
            const isCalling = t.status === 'calling_waiter';
            const isOccupied = t.status === 'occupied';

            return (
              <div
                key={t.id}
                className={`bg-slate-900/90 border rounded-2xl p-4 transition duration-200 flex flex-col justify-between relative overflow-hidden ${
                  isCalling
                    ? 'border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : isOccupied
                    ? 'border-blue-500/30 bg-blue-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Calling indicator banner */}
                {isCalling && (
                  <div className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-3 py-1 rounded-full mb-3 flex items-center justify-between animate-pulse">
                    <span className="flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5 text-amber-400" />
                      Guest Calling Waiter!
                    </span>
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'occupied')}
                      className="text-[9px] underline hover:text-white"
                    >
                      Acknowledge
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                        <span>{t.table_number}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {t.section || 'Main Dining'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenQRModal(t)}
                        title="View & Print Table QR Code"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      >
                        <QrCode className="w-4 h-4 text-orange-400" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(t)}
                        title="Edit Table"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTable(t.id)}
                        title="Delete Table"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300 my-3">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Capacity: {t.capacity} Guests</span>
                  </div>
                </div>

                {/* Status Switcher & Simulator */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <select
                    value={t.status}
                    onChange={(e) => handleUpdateStatus(t.id, e.target.value as TableStatus)}
                    className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 border focus:outline-none cursor-pointer transition ${
                      t.status === 'available'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : t.status === 'occupied'
                        ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                        : t.status === 'calling_waiter'
                        ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                        : 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                    }`}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="calling_waiter">Calling Waiter</option>
                    <option value="reserved">Reserved</option>
                  </select>

                  <a
                    href={`/?hotel=${hotel.slug}&table=${encodeURIComponent(t.table_number)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 hover:text-orange-400 flex items-center gap-1 transition"
                  >
                    Open Menu
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Table Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingTable ? `Edit Table ${editingTable.table_number}` : 'Add New Dining Table'}
      >
        <form onSubmit={handleSaveTable} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Table Number / Identifier *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. T-01, VIP-2, Rooftop-A"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Guest Capacity
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dining Section / Area
              </label>
              <input
                type="text"
                placeholder="e.g. Main Dining, Terrace"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Initial Table Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TableStatus)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="available">Available (Vacant)</option>
              <option value="occupied">Occupied (Seated)</option>
              <option value="reserved">Reserved</option>
              <option value="calling_waiter">Calling Waiter</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
            >
              {saving ? 'Saving...' : editingTable ? 'Save Changes' : 'Create Table'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Table QR Code & Tent Card Modal */}
      <Modal
        isOpen={!!qrModalTable}
        onClose={() => setQrModalTable(null)}
        title={qrModalTable ? `QR Code: Table ${qrModalTable.table_number}` : ''}
      >
        {qrModalTable && (
          <div className="space-y-5 text-center">
            <p className="text-xs text-slate-400">
              When a guest scans this QR code at their table, the menu automatically links to{' '}
              <strong className="text-white">Table {qrModalTable.table_number}</strong> for self-ordering and waiter service.
            </p>

            <div className="bg-white p-6 rounded-2xl inline-block mx-auto shadow-2xl border-4 border-slate-200">
              <div className="text-slate-900 font-bold text-sm tracking-wider uppercase mb-1">
                {hotel.name}
              </div>
              <div className="text-xs text-slate-600 font-semibold mb-3">
                TABLE {qrModalTable.table_number} • {qrModalTable.section}
              </div>
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`Table ${qrModalTable.table_number} QR Code`}
                  className="w-56 h-56 mx-auto rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
              <div className="text-[11px] text-slate-600 mt-3 font-medium">
                Scan to browse menu, order & call waiter
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={qrCodeDataUrl}
                download={`${hotel.slug}-table-${qrModalTable.table_number}-qr.png`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                Download PNG
              </a>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Tent Card
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
