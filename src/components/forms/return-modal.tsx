'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReturnModalProps {
  onClose: () => void;
  onSave: () => void;
}

export function ReturnModal({ onClose, onSave }: ReturnModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeIssues, setActiveIssues] = useState<any[]>([]);
  const [form, setForm] = useState({
    issueId: '',
    returnDate: new Date().toISOString().split('T')[0],
    returnCondition: 'GOOD',
    remarks: '',
  });

  useEffect(() => {
    fetch('/api/issues?activeOnly=true&limit=200')
      .then(r => r.json())
      .then(d => setActiveIssues(d.issues || []));
  }, []);

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.issueId || !form.returnDate) {
      toast.error('Issue record and return date are required');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error || 'Failed'); return; }
      toast.success('Asset returned successfully!');
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Process Return</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Issued Asset *</label>
            <select value={form.issueId} onChange={e => set('issueId', e.target.value)} className="input-field">
              <option value="">Select issued asset</option>
              {activeIssues.map((i: any) => (
                <option key={i.id} value={i.id}>
                  {i.asset?.assetName} → {i.employee?.name}
                </option>
              ))}
            </select>
            {activeIssues.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No active issues found</p>
            )}
          </div>

          <div>
            <label className="label">Return Date *</label>
            <input type="date" value={form.returnDate} onChange={e => set('returnDate', e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="label">Return Condition</label>
            <select value={form.returnCondition} onChange={e => set('returnCondition', e.target.value)} className="input-field">
              <option value="NEW">New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor (Needs Repair)</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>

          <div>
            <label className="label">Remarks</label>
            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
              className="input-field" rows={3} placeholder="Optional notes..." />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Processing...' : 'Process Return'}
          </button>
        </div>
      </div>
    </div>
  );
}
