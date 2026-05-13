'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface TransferModalProps {
  onClose: () => void;
  onSave: () => void;
}

export function TransferModal({ onClose, onSave }: TransferModalProps) {
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [form, setForm] = useState({
    assetId: '',
    fromLocationId: '',
    toLocationId: '',
    transferDate: new Date().toISOString().split('T')[0],
    receivedBy: '',
    remarks: '',
  });

  useEffect(() => {
    fetch('/api/assets?limit=200').then(r => r.json()).then(d => {
      const transferable = (d.assets || []).filter((a: any) => a.status !== 'ISSUED');
      setAssets(transferable);
    });
    fetch('/api/locations').then(r => r.json()).then(setLocations);
  }, []);

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  // Auto-fill from location when asset is selected
  const handleAssetChange = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    setForm(f => ({ ...f, assetId, fromLocationId: asset?.locationId || '' }));
  };

  const handleSubmit = async () => {
    if (!form.assetId || !form.toLocationId || !form.transferDate) {
      toast.error('Asset, destination, and transfer date are required');
      return;
    }
    if (form.fromLocationId && form.fromLocationId === form.toLocationId) {
      toast.error('Source and destination locations must be different');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error || 'Failed'); return; }
      toast.success('Transfer recorded!');
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Transfer Asset</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Asset *</label>
            <select value={form.assetId} onChange={e => handleAssetChange(e.target.value)} className="input-field">
              <option value="">Select asset</option>
              {assets.map((a: any) => (
                <option key={a.id} value={a.id}>{a.assetName} — {a.assetTag} [{a.status}]</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">From Location</label>
            <select value={form.fromLocationId} onChange={e => set('fromLocationId', e.target.value)} className="input-field">
              <option value="">Select source location</option>
              {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">To Location *</label>
            <select value={form.toLocationId} onChange={e => set('toLocationId', e.target.value)} className="input-field">
              <option value="">Select destination</option>
              {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Transfer Date *</label>
            <input type="date" value={form.transferDate} onChange={e => set('transferDate', e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="label">Received By</label>
            <input type="text" value={form.receivedBy} onChange={e => set('receivedBy', e.target.value)}
              className="input-field" placeholder="Name of recipient" />
          </div>

          <div>
            <label className="label">Remarks</label>
            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
              className="input-field" rows={2} placeholder="Optional notes..." />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Processing...' : 'Transfer Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}
