'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Tag, Hash, Calendar, DollarSign, MapPin, Activity } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatCurrency, CONDITION_LABELS } from '@/lib/utils';
import Link from 'next/link';

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/assets/${id}`)
      .then(r => r.json())
      .then(setAsset)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  }
  if (!asset) {
    return <div className="text-center py-12 text-gray-400">Asset not found</div>;
  }

  const activeIssue = asset.issues?.find((i: any) => i.isActive);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{asset.assetName}</h2>
          <p className="text-sm text-gray-500 font-mono">{asset.assetTag}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={asset.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Asset Info */}
        <div className="md:col-span-2 space-y-5">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" /> Asset Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Asset Tag', asset.assetTag],
                ['Serial Number', asset.serialNumber],
                ['Brand', asset.brand || '—'],
                ['Model', asset.model || '—'],
                ['Category', asset.category?.name || '—'],
                ['Location', asset.location?.name || '—'],
                ['Condition', CONDITION_LABELS[asset.condition] || asset.condition],
                ['Supplier', asset.supplierName || '—'],
                ['Purchase Date', formatDate(asset.purchaseDate)],
                ['Purchase Price', formatCurrency(asset.purchasePrice)],
                ['Warranty Expiry', formatDate(asset.warrantyExpiry)],
                ['Added On', formatDate(asset.createdAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {asset.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{asset.notes}</p>
              </div>
            )}
          </div>

          {/* Active Issue */}
          {activeIssue && (
            <div className="card p-6 border-l-4 border-blue-500">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Currently Issued To</h3>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">{activeIssue.employee.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{activeIssue.employee.name}</p>
                  <p className="text-sm text-gray-500">{activeIssue.employee.designation}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <span>Issued: {formatDate(activeIssue.issueDate)}</span>
                    {activeIssue.expectedReturnDate && (
                      <span>Expected Return: {formatDate(activeIssue.expectedReturnDate)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Issue History */}
          {asset.issues?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Issue History</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {asset.issues.map((issue: any) => (
                  <div key={issue.id} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{issue.employee.name}</p>
                      <span className={`badge ${issue.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {issue.isActive ? 'Active' : 'Returned'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(issue.issueDate)}
                      {issue.returns?.[0] && ` → Returned ${formatDate(issue.returns[0].returnDate)}`}
                    </p>
                    {issue.remarks && <p className="text-xs text-gray-400 mt-1">{issue.remarks}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transfer History */}
          {asset.transfers?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Transfer History</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {asset.transfers.map((t: any) => (
                  <div key={t.id} className="px-6 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">{t.fromLocation?.name || 'Unknown'}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-900">{t.toLocation?.name || 'Unknown'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(t.transferDate)} by {t.transferredBy.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repair Records */}
          {asset.repairRecords?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Repair History</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {asset.repairRecords.map((r: any) => (
                  <div key={r.id} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{r.issueDescription}</p>
                      <span className="badge bg-orange-100 text-orange-700">{r.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sent: {formatDate(r.sentDate)}
                      {r.repairVendor && ` • Vendor: ${r.repairVendor}`}
                      {r.repairCost && ` • Cost: ${formatCurrency(r.repairCost)}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="card overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" /> Activity
            </h3>
          </div>
          <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
            {asset.activityLogs?.map((log: any, i: number) => (
              <div key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                  {i < asset.activityLogs.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                </div>
                <div className="pb-3 min-w-0">
                  <p className="text-xs text-gray-700 leading-relaxed">{log.description}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
