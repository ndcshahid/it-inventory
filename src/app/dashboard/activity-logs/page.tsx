'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Search, Activity } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { formatDate } from '@/lib/utils';

const ACTION_COLORS: Record<string, string> = {
  ASSET_CREATED: 'bg-green-100 text-green-700',
  ASSET_UPDATED: 'bg-blue-100 text-blue-700',
  ASSET_ISSUED: 'bg-indigo-100 text-indigo-700',
  ASSET_RETURNED: 'bg-teal-100 text-teal-700',
  ASSET_TRANSFERRED: 'bg-purple-100 text-purple-700',
  ASSET_SENT_FOR_REPAIR: 'bg-orange-100 text-orange-700',
  ASSET_REPAIR_UPDATED: 'bg-yellow-100 text-yellow-700',
  ASSET_DELETED: 'bg-red-100 text-red-700',
  USER_LOGIN: 'bg-gray-100 text-gray-600',
  EMPLOYEE_CREATED: 'bg-cyan-100 text-cyan-700',
  SYSTEM: 'bg-slate-100 text-slate-600',
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search, limit: '50' });
    const r = await fetch(`/api/activity-logs?${params}`);
    const d = await r.json();
    setLogs(d.logs || []);
    setTotal(d.total || 0);
    setPages(d.pages || 1);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page, search]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Activity Logs</h2>
        <p className="text-sm text-gray-500">{total} total actions</p>
      </div>

      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search logs..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Action</th>
                <th className="table-th">Description</th>
                <th className="table-th">User</th>
                <th className="table-th">Asset</th>
                <th className="table-th">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>{[...Array(5)].map((_, j) => (
                    <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-td text-center py-12">
                    <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">No activity logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <span className={`badge text-[10px] ${ACTION_COLORS[log.actionType] || 'bg-gray-100 text-gray-600'}`}>
                        {log.actionType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="table-td text-gray-700">{log.description}</td>
                    <td className="table-td text-gray-600">{log.user?.name || '—'}</td>
                    <td className="table-td">
                      {log.asset ? (
                        <div>
                          <p className="text-sm text-gray-700">{log.asset.assetName}</p>
                          <p className="text-xs text-gray-400 font-mono">{log.asset.assetTag}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="table-td text-gray-500 text-xs">
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
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
    </div>
  );
}
