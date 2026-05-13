'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit2, Trash2, Package } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { AssetModal } from '@/components/forms/asset-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate, formatCurrency, exportToCSV } from '@/lib/utils';
import Link from 'next/link';

export default function InventoryPage() {
  const { data: session } = useSession();
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canEdit = ['ADMIN', 'IT_MANAGER'].includes(session?.user?.role || '');
  const isAdmin = session?.user?.role === 'ADMIN';

  const fetchAssets = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), search, status: statusFilter,
      categoryId: categoryFilter, locationId: locationFilter,
    });
    const r = await fetch(`/api/assets?${params}`);
    const d = await r.json();
    setAssets(d.assets || []);
    setTotal(d.total || 0);
    setPages(d.pages || 1);
    setLoading(false);
  };

  useEffect(() => { fetchAssets(); }, [page, search, statusFilter, categoryFilter, locationFilter]);
  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories);
    fetch('/api/locations').then(r => r.json()).then(setLocations);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const r = await fetch(`/api/assets/${deleteId}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Asset deleted'); fetchAssets(); }
    else { const d = await r.json(); toast.error(d.error); }
    setDeleteId(null);
  };

  const handleExport = () => {
    const rows = assets.map(a => ({
      'Asset Name': a.assetName,
      'Asset Tag': a.assetTag,
      'Serial Number': a.serialNumber,
      'Category': a.category?.name || '',
      'Brand': a.brand || '',
      'Model': a.model || '',
      'Status': a.status,
      'Condition': a.condition,
      'Location': a.location?.name || '',
      'Purchase Date': formatDate(a.purchaseDate),
      'Purchase Price': a.purchasePrice || '',
    }));
    exportToCSV(rows, 'inventory');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Asset Inventory</h2>
          <p className="text-sm text-gray-500">{total} total assets</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {canEdit && (
            <button onClick={() => { setEditAsset(null); setShowModal(true); }} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-9"
            />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Statuses</option>
            {['AVAILABLE','ISSUED','TRANSFERRED','UNDER_REPAIR','DAMAGED','LOST','RETIRED'].map(s => (
              <option key={s} value={s}>{s.replace('_',' ')}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Categories</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={locationFilter} onChange={e => { setLocationFilter(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Locations</option>
            {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Asset</th>
                <th className="table-th">Category</th>
                <th className="table-th">Brand / Model</th>
                <th className="table-th">Location</th>
                <th className="table-th">Status</th>
                <th className="table-th">Assigned To</th>
                <th className="table-th">Purchase Date</th>
                <th className="table-th w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-td text-center py-12">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">No assets found</p>
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-gray-900">{asset.assetName}</p>
                        <p className="text-xs text-gray-500 font-mono">{asset.assetTag}</p>
                        <p className="text-xs text-gray-400">SN: {asset.serialNumber}</p>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {asset.category?.name || '—'}
                      </span>
                    </td>
                    <td className="table-td text-gray-600">{[asset.brand, asset.model].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="table-td text-gray-600">{asset.location?.name || '—'}</td>
                    <td className="table-td"><StatusBadge status={asset.status} /></td>
                    <td className="table-td text-gray-600">
                      {asset.issues?.[0]?.employee?.name || '—'}
                    </td>
                    <td className="table-td text-gray-500">{formatDate(asset.purchaseDate)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/inventory/${asset.id}`} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {canEdit && (
                          <button
                            onClick={() => { setEditAsset(asset); setShowModal(true); }}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteId(asset.id)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-600 transition-colors"
                          >
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
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination page={page} pages={pages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {showModal && (
        <AssetModal
          asset={editAsset}
          categories={categories}
          locations={locations}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchAssets(); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Asset"
        message="Are you sure you want to delete this asset? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  );
}
