'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmployeeModalProps {
  employee?: any;
  departments: any[];
  locations: any[];
  onClose: () => void;
  onSave: () => void;
}

export function EmployeeModal({ employee, departments, locations, onClose, onSave }: EmployeeModalProps) {
  const isEdit = !!employee;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employeeId: employee?.employeeId || '',
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    designation: employee?.designation || '',
    departmentId: employee?.departmentId || '',
    locationId: employee?.locationId || '',
    isActive: employee?.isActive !== false,
  });

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.employeeId || !form.name) {
      toast.error('Employee ID and name are required');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(isEdit ? `/api/employees/${employee.id}` : '/api/employees', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error || 'Failed'); return; }
      toast.success(isEdit ? 'Employee updated!' : 'Employee created!');
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Employee' : 'Add Employee'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div>
            <label className="label">Employee ID *</label>
            <input type="text" value={form.employeeId} onChange={e => set('employeeId', e.target.value)}
              className="input-field" placeholder="e.g. EMP001" />
          </div>
          <div>
            <label className="label">Full Name *</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              className="input-field" placeholder="Full name" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="input-field" placeholder="email@company.com" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)}
              className="input-field" placeholder="+1-555-0000" />
          </div>
          <div className="col-span-2">
            <label className="label">Designation</label>
            <input type="text" value={form.designation} onChange={e => set('designation', e.target.value)}
              className="input-field" placeholder="e.g. Software Engineer" />
          </div>
          <div>
            <label className="label">Department</label>
            <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} className="input-field">
              <option value="">Select department</option>
              {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <select value={form.locationId} onChange={e => set('locationId', e.target.value)} className="input-field">
              <option value="">Select location</option>
              {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          {isEdit && (
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}
