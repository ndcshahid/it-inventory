'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/employees/${id}`)
      .then(r => r.json())
      .then(setEmployee)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  if (!employee) return <div className="text-center py-12 text-gray-400">Employee not found</div>;

  const activeIssues = employee.issuedAssets?.filter((i: any) => i.isActive) || [];
  const pastIssues = employee.issuedAssets?.filter((i: any) => !i.isActive) || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold">{employee.name.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{employee.name}</h2>
            <p className="text-sm text-gray-500">{employee.employeeId}</p>
          </div>
        </div>
        <span className={`ml-auto badge ${employee.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {employee.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Employee Info</h3>
          <div className="space-y-3 text-sm">
            {[
              ['Employee ID', employee.employeeId],
              ['Department', employee.department?.name || '—'],
              ['Designation', employee.designation || '—'],
              ['Location', employee.location?.name || '—'],
              ['Email', employee.email || '—'],
              ['Phone', employee.phone || '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-medium text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-5">
          {/* Currently Issued */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Currently Issued Assets</h3>
              <span className="badge bg-blue-100 text-blue-700">{activeIssues.length}</span>
            </div>
            {activeIssues.length === 0 ? (
              <div className="px-6 py-6 text-center text-sm text-gray-400">No active issues</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activeIssues.map((issue: any) => (
                  <div key={issue.id} className="px-6 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{issue.asset.assetName}</p>
                      <p className="text-xs text-gray-500">{issue.asset.category?.name} • Tag: {issue.asset.assetTag}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>Issued: {formatDate(issue.issueDate)}</p>
                      {issue.expectedReturnDate && <p>Return: {formatDate(issue.expectedReturnDate)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Issues */}
          {pastIssues.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Past Issues</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {pastIssues.map((issue: any) => (
                  <div key={issue.id} className="px-6 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{issue.asset.assetName}</p>
                      <p className="text-xs text-gray-500">{issue.asset.assetTag}</p>
                    </div>
                    <span className="badge bg-gray-100 text-gray-600">Returned</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
