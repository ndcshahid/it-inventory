'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface IssueModalProps {
  onClose: () => void;
  onSave: () => void;
  issue?: any;
}

export function IssueModal({ onClose, onSave, issue }: IssueModalProps) {
  const isEdit = !!issue;
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [form, setForm] = useState({
    assetId: issue?.assetId || '',
    employeeId: issue?.employeeId || '',
    issueDate: issue?.issueDate
      ? new Date(issue.issueDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    expectedReturnDate: issue?.expectedReturnDate
      ? new Date(issue.expectedReturnDate).toISOString().split('T')[0]
      : '',
    remarks: issue?.remarks || '',
    documentLink: issue?.documentLink || '',
  });

  useEffect(() => {
    fetch('/api/assets?status=AVAILABLE&limit=200').then(r => r.json()).then(d => setAssets(d.assets || []));
    fetch('/api/employees?limit=200').then(r => r.json()).then(d => setEmployees(d.employees || []));
    fetch('/api/departments').then(r => r.json()).then(d => setDepartments(d.departments || d || []));
  }, []);

  const filteredEmployees = selectedDepartment
    ? employees.filter(e => e.department?.id === selectedDepartment)
    : employees;

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!isEdit && (!form.assetId || !form.employeeId)) {
      toast.error('Asset and employee are required');
      return;
    }
    if (!form.issueDate) {
      toast.error('Issue date is required');
      return;
    }
    setLoading(true);
    try {
      const r = isEdit
        ? await fetch(`/api/issues/${issue.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              issueDate: form.issueDate,
              expectedReturnDate: form.expectedReturnDate,
              remarks: form.remarks,
              documentLink: form.documentLink,
            }),
          })
        : await fetch('/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          });

      const d = await r.json();
      if (!r.ok) { toast.error(d.error || 'Failed to save'); return; }
      toast.success(isEdit ? 'Issue record updated!' : 'Asset issued successfully!');
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Issue Record' : 'Issue Asset'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {isEdit ? (
            <>
              <div>
                <label className="label">Asset</label>
                <p className="input-field bg-gray-50 text-gray-600">{issue.asset?.assetName} — {issue.asset?.assetTag}</p>
              </div>
              <div>
                <label className="label">Employee</label>
                <p className="input-field bg-gray-50 text-gray-600">{issue.employee?.name} ({issue.employee?.employeeId})</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Asset * <span className="text-xs font-normal text-gray-400">(Available only)</span></label>
                <select value={form.assetId} onChange={e => set('assetId', e.target.value)} className="input-field">
                  <option value="">Select asset</option>
                  {assets.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.assetName} — {a.assetTag}</option>
                  ))}
                </select>
                {assets.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No available assets found</p>
                )}
              </div>

              <div>
                <label className="label">Filter by Department</label>
                <select
                  value={selectedDepartment}
                  onChange={e => { setSelectedDepartment(e.target.value); set('employeeId', ''); }}
                  className="input-field"
                >
                  <option value="">All Departments</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Employee *</label>
                <select value={form.employeeId} onChange={e => set('employeeId', e.target.value)} className="input-field">
                  <option value="">Select employee</option>
                  {filteredEmployees.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>
                  ))}
                </select>
                {selectedDepartment && filteredEmployees.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No employees found in this department</p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="label">Issue Date *</label>
            <input type="date" value={form.issueDate} onChange={e => set('issueDate', e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="label">Expected Return Date</label>
            <input type="date" value={form.expectedReturnDate} onChange={e => set('expectedReturnDate', e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="label">Remarks</label>
            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
              className="input-field" rows={3} placeholder="Optional notes..." />
          </div>

          <div>
            <label className="label">Document Link</label>
            <input
              type="url"
              value={form.documentLink}
              onChange={e => set('documentLink', e.target.value)}
              className="input-field"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Issue Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}
