'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Plus, Search, ArrowRightLeft, Pencil } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Pagination } from '@/components/ui/pagination';
import { IssueModal } from '@/components/forms/issue-modal';
import { formatDate } from '@/lib/utils';

export default function IssuesPage() {
  const { data: session } = useSession();
  const [issues, setIssues] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<any>(null);

  const canEdit = ['ADMIN', 'IT_MANAGER'].includes(session?.user?.role || '');

  const fetchIssues = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search, activeOnly: String(activeOnly) });
    const r = await fetch(`/api/issues?${params}`);
    const d = await r.json();
    setIssues(d.issues || []);
    setTotal(d.total || 0);
    setPages(d.pages || 1);
    setLoading(false);
  };

  useEffect(() => { fetchIssues(); }, [page, search, activeOnly]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Asset Issuance</h2>
          <p className="text-sm text-gray-500">{total} records</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Issue Asset
          </button>
        )}
      </div>

      <div className="card p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)}
            className="rounded border-gray-300 text-blue-600" />
          Active only
        </label>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Asset</th>
                <th className="table-th">Employee</th>
                <th className="table-th">Issue Date</th>
                <th className="table-th">Expected Return</th>
                <th className="table-th">Issued By</th>
                <th className="table-th">Status</th>
                <th className="table-th">Remarks</th>
                <th className="table-th">Document Link</th>
                {canEdit && <th className="table-th">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(canEdit ? 9 : 8)].map((_, j) => (
                    <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="table-td text-center py-12">
                    <ArrowRightLeft className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">No issuance records found</p>
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <p className="font-medium text-gray-900">{issue.asset?.assetName}</p>
                      <p className="text-xs text-gray-500">{issue.asset?.assetTag}</p>
                    </td>
                    <td className="table-td">
                      <p className="font-medium text-gray-900">{issue.employee?.name}</p>
                      <p className="text-xs text-gray-500">{issue.employee?.employeeId}</p>
                    </td>
                    <td className="table-td text-gray-600">{formatDate(issue.issueDate)}</td>
                    <td className="table-td text-gray-600">{issue.expectedReturnDate ? formatDate(issue.expectedReturnDate) : '—'}</td>
                    <td className="table-td text-gray-600">{issue.issuedBy?.name}</td>
                    <td className="table-td">
                      <span className={`badge ${issue.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {issue.isActive ? 'Active' : 'Returned'}
                      </span>
                    </td>
                    <td className="table-td text-gray-500 max-w-xs truncate">{issue.remarks || '—'}</td>
                    <td className="table-td">
                      {issue.documentLink
                        ? <a href={issue.documentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-xs block">View</a>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    {canEdit && (
                      <td className="table-td">
                        <button
                          onClick={() => setEditingIssue(issue)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    )}
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
        <IssueModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchIssues(); }}
        />
      )}
      {editingIssue && (
        <IssueModal
          issue={editingIssue}
          onClose={() => setEditingIssue(null)}
          onSave={() => { setEditingIssue(null); fetchIssues(); }}
        />
      )}
    </div>
  );
}
