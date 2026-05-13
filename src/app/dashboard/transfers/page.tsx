'use client';

import { useEffect, useState } from 'react';
import { Plus, ArrowLeftRight, Download } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { TransferModal } from '@/components/forms/transfer-modal';
import { formatDate, exportToCSV } from '@/lib/utils';

export default function TransfersPage() {
  const { data: session } = useSession();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const canEdit = ['ADMIN', 'IT_MANAGER'].includes(session?.user?.role || '');

  const fetchTransfers = async () => {
    setLoading(true);
    const r = await fetch('/api/transfers');
    const d = await r.json();
    setTransfers(d);
    setLoading(false);
  };

  useEffect(() => { fetchTransfers(); }, []);

  const handleExport = () => {
    const rows = transfers.map(t => ({
      'Asset': t.asset?.assetName,
      'Asset Tag': t.asset?.assetTag,
      'From Location': t.fromLocation?.name || 'N/A',
      'To Location': t.toLocation?.name || 'N/A',
      'Transfer Date': formatDate(t.transferDate),
      'Transferred By': t.transferredBy?.name,
      'Received By': t.receivedBy || '',
      'Remarks': t.remarks || '',
    }));
    exportToCSV(rows, 'transfers');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Stock Transfers</h2>
          <p className="text-sm text-gray-500">{transfers.length} transfer records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" /> Export
          </button>
          {canEdit && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> New Transfer
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Asset</th>
                <th className="table-th">From Location</th>
                <th className="table-th">To Location</th>
                <th className="table-th">Transfer Date</th>
                <th className="table-th">Transferred By</th>
                <th className="table-th">Received By</th>
                <th className="table-th">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => (
                    <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-td text-center py-12">
                    <ArrowLeftRight className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">No transfer records found</p>
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <p className="font-medium text-gray-900">{t.asset?.assetName}</p>
                      <p className="text-xs text-gray-500">{t.asset?.assetTag}</p>
                    </td>
                    <td className="table-td">
                      <span className="text-sm text-gray-600">{t.fromLocation?.name || '—'}</span>
                    </td>
                    <td className="table-td">
                      <span className="text-sm font-medium text-gray-900">{t.toLocation?.name || '—'}</span>
                    </td>
                    <td className="table-td text-gray-600">{formatDate(t.transferDate)}</td>
                    <td className="table-td text-gray-600">{t.transferredBy?.name}</td>
                    <td className="table-td text-gray-600">{t.receivedBy || '—'}</td>
                    <td className="table-td text-gray-500 max-w-xs truncate">{t.remarks || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <TransferModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchTransfers(); }}
        />
      )}
    </div>
  );
}
