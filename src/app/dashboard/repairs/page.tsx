'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Plus, Wrench, Edit2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { RepairModal } from '@/components/forms/repair-modal';
import { RepairUpdateModal } from '@/components/forms/repair-update-modal';
import { formatDate, formatCurrency } from '@/lib/utils';

const REPAIR_STATUS_COLORS: Record<string, string> = {
  SENT_FOR_REPAIR: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  REPAIRED: 'bg-green-100 text-green-700',
  NOT_REPAIRABLE: 'bg-red-100 text-red-700',
};

export default function RepairsPage() {
  const { data: session } = useSession();
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [updateRepair, setUpdateRepair] = useState<any>(null);

  const canEdit = ['ADMIN', 'IT_MANAGER'].includes(session?.user?.role || '');

  const fetchRepairs = async () => {
    setLoading(true);
    const r = await fetch('/api/repairs');
    const d = await r.json();
    setRepairs(d);
    setLoading(false);
  };

  useEffect(() => { fetchRepairs(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Repair Management</h2>
          <p className="text-sm text-gray-500">{repairs.length} repair records</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Send for Repair
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Sent for Repair', status: 'SENT_FOR_REPAIR', color: 'bg-yellow-50 text-yellow-600' },
          { label: 'In Progress', status: 'IN_PROGRESS', color: 'bg-orange-50 text-orange-600' },
          { label: 'Repaired', status: 'REPAIRED', color: 'bg-green-50 text-green-600' },
          { label: 'Not Repairable', status: 'NOT_REPAIRABLE', color: 'bg-red-50 text-red-600' },
        ].map(({ label, status, color }) => (
          <div key={status} className="card p-4">
            <p className={`text-2xl font-bold ${color.split(' ')[1]}`}>
              {repairs.filter(r => r.status === status).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Asset</th>
                <th className="table-th">Issue Description</th>
                <th className="table-th">Vendor</th>
                <th className="table-th">Sent Date</th>
                <th className="table-th">Expected Return</th>
                <th className="table-th">Cost</th>
                <th className="table-th">Status</th>
                {canEdit && <th className="table-th w-16">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(8)].map((_, j) => (
                    <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : repairs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-td text-center py-12">
                    <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">No repair records found</p>
                  </td>
                </tr>
              ) : (
                repairs.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <p className="font-medium text-gray-900">{r.asset?.assetName}</p>
                      <p className="text-xs text-gray-500">{r.asset?.assetTag}</p>
                    </td>
                    <td className="table-td text-gray-600 max-w-xs">
                      <p className="truncate">{r.issueDescription}</p>
                    </td>
                    <td className="table-td text-gray-600">{r.repairVendor || '—'}</td>
                    <td className="table-td text-gray-600">{formatDate(r.sentDate)}</td>
                    <td className="table-td text-gray-600">{r.expectedReturn ? formatDate(r.expectedReturn) : '—'}</td>
                    <td className="table-td text-gray-600">{r.repairCost ? formatCurrency(r.repairCost) : '—'}</td>
                    <td className="table-td">
                      <span className={`badge ${REPAIR_STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="table-td">
                        <button
                          onClick={() => setUpdateRepair(r)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <RepairModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchRepairs(); }}
        />
      )}

      {updateRepair && (
        <RepairUpdateModal
          repair={updateRepair}
          onClose={() => setUpdateRepair(null)}
          onSave={() => { setUpdateRepair(null); fetchRepairs(); }}
        />
      )}
    </div>
  );
}
