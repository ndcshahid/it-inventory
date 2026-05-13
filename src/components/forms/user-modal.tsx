'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserModalProps {
  user?: any;
  onClose: () => void;
  onSave: () => void;
}

export function UserModal({ user, onClose, onSave }: UserModalProps) {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    name: user?.name || '',
    password: '',
    role: user?.role || 'VIEWER',
    isActive: user?.isActive !== false,
  });

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.username || !form.name || (!isEdit && !form.password)) {
      toast.error('Username, name, and password are required');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(isEdit ? `/api/users/${user.id}` : '/api/users', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error || 'Failed'); return; }
      toast.success(isEdit ? 'User updated!' : 'User created!');
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit User' : 'Add User'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              className="input-field" placeholder="Full name" />
          </div>
          <div>
            <label className="label">Username *</label>
            <input type="text" value={form.username} onChange={e => set('username', e.target.value)}
              className="input-field font-mono" placeholder="username" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="input-field" placeholder="email@company.com" />
          </div>
          <div>
            <label className="label">{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
              className="input-field" placeholder={isEdit ? 'Leave blank to keep current' : 'Password'} />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className="input-field">
              <option value="ADMIN">Admin</option>
              <option value="IT_MANAGER">IT Manager</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          {isEdit && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
                className="rounded border-gray-300 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          )}

          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <strong>Roles:</strong> Admin = full access · IT Manager = manage assets · Viewer = read only
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}
