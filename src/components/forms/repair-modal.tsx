'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface RepairModalProps {
  onClose: () => void;
  onSave: () => void;
}

export function RepairModal({ onClose, onSave }: RepairModalProps) {
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [form, setForm] = useState({
    assetId: '',
    issueDescription: '',
    repairVendor: '',
    sentDate: new Date().toISOString().split('T')[0],
    expectedReturn: '',
    repairCost: '',
    remarks: '',
  });

  useEffect(() => {
    fetch('/api/assets?limit=200').then(r => r.json()).then(d => {
      const repairable = (d.assets || []).filter((a: any) =>
        ['AVAILABLE', 'DAMAGED', 'UNDER_REPAIR'].includes(a.status)
      );
      setAssets(repairable);
    });
  }, []);

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.assetId || !form.issueDescription || !form.sentDate) {
      toast.error('Asset, issue description, and sent date are required');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error || 'Failed'); return; }
      toast.success('Repair record created!');
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Send Asset for Repair</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Asset *</label>
            <select value={form.assetId} onChange={e => set('assetId', e.target.value)} className="input-field">
              <option value="">Select asset</option>
              {assets.map((a: any) => (
                <option key={a.id} value={a.id}>{a.assetName} — {a.assetTag} [{a.status}]</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Issue Description *</label>
            <textarea value={form.issueDescription} onChange={e => set('issueDescription', e.target.value)}
              className="input-field" rows={3} placeholder="Describe the problem..." />
          </div>

          <div>
            <label className="label">Repair Vendor</label>
            <input type="text" value={form.repairVendor} onChange={e => set('repairVendor', e.target.value)}
              className="input-field" placeholder="Vendor/Service center name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Sent Date *</label>
              <input type="date" value={form.sentDate} onChange={e => set('sentDate', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">Expected Return</label>
              <input type="date" value={form.expectedReturn} onChange={e => set('expectedReturn', e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label className="label">Repair Cost ($)</label>
            <input type="number" step="0.01" value={form.repairCost} onChange={e => set('repairCost', e.target.value)}
              className="input-field" placeholder="0.00" />
          </div>

          <div>
            <label className="label">Remarks</label>
            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
              className="input-field" rows={2} placeholder="Additional notes..." />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : 'Send for Repair'}
          </button>
        </div>
      </div>
    </div>
  );
}
