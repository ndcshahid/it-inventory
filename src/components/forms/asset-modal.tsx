'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface AssetModalProps {
  asset?: any;
  categories: any[];
  locations: any[];
  onClose: () => void;
  onSave: () => void;
}

export function AssetModal({ asset, categories, locations, onClose, onSave }: AssetModalProps) {
  const isEdit = !!asset;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    assetName: asset?.assetName || '',
    assetTag: asset?.assetTag || '',
    serialNumber: asset?.serialNumber || '',
    brand: asset?.brand || '',
    model: asset?.model || '',
    categoryId: asset?.categoryId || '',
    locationId: asset?.locationId || '',
    purchaseDate: asset?.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
    purchasePrice: asset?.purchasePrice || '',
    warrantyExpiry: asset?.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
    supplierName: asset?.supplierName || '',
    condition: asset?.condition || 'GOOD',
    status: asset?.status || 'AVAILABLE',
    notes: asset?.notes || '',
  });

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.assetName || !form.assetTag || !form.serialNumber) {
      toast.error('Asset name, tag, and serial number are required');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(isEdit ? `/api/assets/${asset.id}` : '/api/assets', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error || 'Failed to save asset'); return; }
      toast.success(isEdit ? 'Asset updated!' : 'Asset created!');
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Asset' : 'Add New Asset'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Asset Name *</label>
            <input type="text" value={form.assetName} onChange={e => set('assetName', e.target.value)}
              className="input-field" placeholder="e.g. Dell Latitude 5540" />
          </div>

          <div>
            <label className="label">Asset Tag *</label>
            <input type="text" value={form.assetTag} onChange={e => set('assetTag', e.target.value)}
              className="input-field font-mono" placeholder="e.g. TAG-LAP-001" />
          </div>

          <div>
            <label className="label">Serial Number *</label>
            <input type="text" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)}
              className="input-field font-mono" placeholder="e.g. SN-DELL-001" />
          </div>

          <div>
            <label className="label">Brand</label>
            <input type="text" value={form.brand} onChange={e => set('brand', e.target.value)}
              className="input-field" placeholder="e.g. Dell, HP, Lenovo" />
          </div>

          <div>
            <label className="label">Model</label>
            <input type="text" value={form.model} onChange={e => set('model', e.target.value)}
              className="input-field" placeholder="e.g. Latitude 5540" />
          </div>

          <div>
            <label className="label">Category</label>
            <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className="input-field">
              <option value="">Select category</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Location</label>
            <select value={form.locationId} onChange={e => set('locationId', e.target.value)} className="input-field">
              <option value="">Select location</option>
              {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Purchase Date</label>
            <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="label">Purchase Price ($)</label>
            <input type="number" step="0.01" value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)}
              className="input-field" placeholder="0.00" />
          </div>

          <div>
            <label className="label">Warranty Expiry</label>
            <input type="date" value={form.warrantyExpiry} onChange={e => set('warrantyExpiry', e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="label">Supplier</label>
            <input type="text" value={form.supplierName} onChange={e => set('supplierName', e.target.value)}
              className="input-field" placeholder="Supplier name" />
          </div>

          <div>
            <label className="label">Condition</label>
            <select value={form.condition} onChange={e => set('condition', e.target.value)} className="input-field">
              {['NEW','GOOD','FAIR','POOR','DAMAGED'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {isEdit && (
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
                {['AVAILABLE','ISSUED','TRANSFERRED','UNDER_REPAIR','DAMAGED','LOST','RETIRED'].map(s => (
                  <option key={s} value={s}>{s.replace('_',' ')}</option>
                ))}
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              className="input-field" rows={3} placeholder="Additional notes..." />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update Asset' : 'Add Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}
