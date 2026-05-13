'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { UserModal } from '@/components/forms/user-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/utils';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  IT_MANAGER: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-gray-100 text-gray-600',
};

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const r = await fetch('/api/users');
    const d = await r.json();
    setUsers(d);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const r = await fetch(`/api/users/${deleteId}`, { method: 'DELETE' });
    if (r.ok) { toast.success('User deleted'); fetchUsers(); }
    else { const d = await r.json(); toast.error(d.error); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">{users.length} users</p>
        </div>
        <button onClick={() => { setEditUser(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">User</th>
                <th className="table-th">Username</th>
                <th className="table-th">Email</th>
                <th className="table-th">Role</th>
                <th className="table-th">Status</th>
                <th className="table-th">Created</th>
                <th className="table-th w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => (
                    <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-xs">{user.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="table-td font-mono text-gray-600 text-xs">{user.username}</td>
                    <td className="table-td text-gray-600">{user.email || '—'}</td>
                    <td className="table-td">
                      <span className={`badge ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-td text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditUser(user); setShowModal(true); }}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {user.id !== session?.user?.id && (
                          <button onClick={() => setDeleteId(user.id)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <UserModal
          user={editUser}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchUsers(); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  );
}
