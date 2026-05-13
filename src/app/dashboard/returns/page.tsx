'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ReturnModal } from '@/components/forms/return-modal';
import { formatDate, CONDITION_LABELS } from '@/lib/utils';

export default function ReturnsPage() {
  const { data: session } = useSession();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const canEdit = ['ADMIN', 'IT_MANAGER'].includes(session?.user?.role || '');

  const fetchReturns = async () => {
    setLoading(true);
    const r = await fetch('/api/returns');
    const d = await r.json();
    setReturns(d);
    setLoading(false);
  };

  useEffect(() => { fetchReturns(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Asset Returns</h2>
          <p className="text-sm text-gray-500">{returns.length} return records</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Process Return
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Asset</th>
                <th className="table-th">Employee</th>
                <th className="table-th">Return Date</th>
                <th className="table-th">Condition</th>
                <th className="table-th">Received By</th>
                <th className="table-th">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => (
                    <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-td text-center py-12">
                    <RotateCcw className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">No return records found</p>
                  </td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <p className="font-medium text-gray-900">{ret.asset?.assetName}</p>
                      <p className="text-xs text-gray-500">{ret.asset?.assetTag}</p>
                    </td>
                    <td className="table-td">
                      <p className="font-medium text-gray-900">{ret.issue?.employee?.name}</p>
                    </td>
                    <td className="table-td text-gray-600">{formatDate(ret.returnDate)}</td>
                    <td className="table-td">
                      <span className={`badge ${
                        ret.returnCondition === 'NEW' || ret.returnCondition === 'GOOD' ? 'bg-green-100 text-green-700' :
                        ret.returnCondition === 'FAIR' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {CONDITION_LABELS[ret.returnCondition] || ret.returnCondition}
                      </span>
                    </td>
                    <td className="table-td text-gray-600">{ret.receivedBy?.name}</td>
                    <td className="table-td text-gray-500">{ret.remarks || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ReturnModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchReturns(); }}
        />
      )}
    </div>
  );
}
