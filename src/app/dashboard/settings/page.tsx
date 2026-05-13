'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Tags, MapPin, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SimpleModal } from '@/components/ui/simple-modal';

type Tab = 'categories' | 'locations' | 'departments';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: string; type: Tab } | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const fetchAll = async () => {
    const [cats, locs, depts] = await Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/locations').then(r => r.json()),
      fetch('/api/departments').then(r => r.json()),
    ]);
    setCategories(cats);
    setLocations(locs);
    setDepartments(depts);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditItem(null); setFormName(''); setFormDesc(''); setShowModal(true); };
  const openEdit = (item: any) => { setEditItem(item); setFormName(item.name); setFormDesc(item.description || ''); setShowModal(true); };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Name is required'); return; }
    const endpoint = `/api/${tab}`;
    const method = editItem ? 'PUT' : 'POST';
    const url = editItem ? `${endpoint}/${editItem.id}` : endpoint;

    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formName, description: formDesc }),
    });
    if (r.ok) {
      toast.success(editItem ? 'Updated!' : 'Created!');
      setShowModal(false);
      fetchAll();
    } else {
      const d = await r.json();
      toast.error(d.error || 'Failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const r = await fetch(`/api/${deleteItem.type}/${deleteItem.id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Deleted'); fetchAll(); }
    else { const d = await r.json(); toast.error(d.error); }
    setDeleteItem(null);
  };

  const tabs = [
    { key: 'categories' as Tab, label: 'Categories', icon: Tags, data: categories },
    { key: 'locations' as Tab, label: 'Locations', icon: MapPin, data: locations },
    { key: 'departments' as Tab, label: 'Departments', icon: Building2, data: departments },
  ];

  const currentData = tabs.find(t => t.key === tab)?.data || [];

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Manage categories, locations, and departments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {tabs.find(t => t.key === key)?.data.length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add {tab.slice(0, -1).charAt(0).toUpperCase() + tab.slice(1, -1)}
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Description</th>
              <th className="table-th">Count</th>
              <th className="table-th">Status</th>
              <th className="table-th w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-td text-center py-8 text-gray-400">No items found</td>
              </tr>
            ) : (
              currentData.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium text-gray-900">{item.name}</td>
                  <td className="table-td text-gray-600">{item.description || '—'}</td>
                  <td className="table-td">
                    <span className="badge bg-blue-100 text-blue-700">
                      {item._count?.assets ?? item._count?.employees ?? 0}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={`badge ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteItem({ id: item.id, type: tab })} className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <SimpleModal
          title={`${editItem ? 'Edit' : 'Create'} ${tab.slice(0, -1)}`}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        >
          <div className="space-y-4">
            <div>
              <label className="label">Name *</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                className="input-field" placeholder="Enter name" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)}
                className="input-field" rows={3} placeholder="Optional description" />
            </div>
          </div>
        </SimpleModal>
      )}

      <ConfirmDialog
        open={!!deleteItem}
        title="Delete Item"
        message="Are you sure you want to delete this item? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        danger
      />
    </div>
  );
}
