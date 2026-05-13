'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface RepairUpdateModalProps {
  repair: any;
  onClose: () => void;
  onSave: () => void;
}

export function RepairUpdateModal({ repair, onClose, onSave }: RepairUpdateModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    status: repair.status,
    repairCost: repair.repairCost || '',
    remarks: repair.remarks || '',
    resolvedAssetStatus: 'AVAILABLE',
  });

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));
  const isResolved = form.status === 'REPAIRED' || form.status === 'NOT_REPAIRABLE';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/repairs/${repair.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error || 'Failed'); return; }
      toast.success('Repair record updated!');
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Update Repair</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium text-gray-900">{repair.asset?.assetName}</p>
            <p className="text-gray-500 text-xs mt-0.5">{repair.issueDescription}</p>
          </div>

          <div>
            <label className="label">Repair Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
              <option value="SENT_FOR_REPAIR">Sent for Repair</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REPAIRED">Repaired</option>
              <option value="NOT_REPAIRABLE">Not Repairable</option>
            </select>
          </div>

          {isResolved && (
            <div>
              <label className="label">Set Asset Status To</label>
              <select value={form.resolvedAssetStatus} onChange={e => set('resolvedAssetStatus', e.target.value)} className="input-field">
                <option value="AVAILABLE">Available</option>
                <option value="RETIRED">Retired</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </div>
          )}

          <div>
            <label className="label">Repair Cost ($)</label>
            <input type="number" step="0.01" value={form.repairCost} onChange={e => set('repairCost', e.target.value)}
              className="input-field" placeholder="0.00" />
          </div>

          <div>
            <label className="label">Remarks</label>
            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
              className="input-field" rows={3} placeholder="Update notes..." />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : 'Update Repair'}
          </button>
        </div>
      </div>
    </div>
  );
}
