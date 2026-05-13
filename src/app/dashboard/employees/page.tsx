'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Edit2, Trash2, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Pagination } from '@/components/ui/pagination';
import { EmployeeModal } from '@/components/forms/employee-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Link from 'next/link';

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canEdit = ['ADMIN', 'IT_MANAGER'].includes(session?.user?.role || '');
  const isAdmin = session?.user?.role === 'ADMIN';

  const fetchEmployees = async () => {
    setLoading(true);
    const r = await fetch(`/api/employees?page=${page}&search=${search}`);
    const d = await r.json();
    setEmployees(d.employees || []);
    setTotal(d.total || 0);
    setPages(d.pages || 1);
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, [page, search]);
  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(setDepartments);
    fetch('/api/locations').then(r => r.json()).then(setLocations);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const r = await fetch(`/api/employees/${deleteId}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Employee deleted'); fetchEmployees(); }
    else { const d = await r.json(); toast.error(d.error); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Employees</h2>
          <p className="text-sm text-gray-500">{total} total employees</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditEmployee(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        )}
      </div>

      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-9"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Employee</th>
                <th className="table-th">Department</th>
                <th className="table-th">Designation</th>
                <th className="table-th">Location</th>
                <th className="table-th">Contact</th>
                <th className="table-th">Active Assets</th>
                <th className="table-th">Status</th>
                <th className="table-th w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(8)].map((_, j) => (
                    <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-td text-center py-12">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">No employees found</p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-xs">{emp.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{emp.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-gray-600">{emp.department?.name || '—'}</td>
                    <td className="table-td text-gray-600">{emp.designation || '—'}</td>
                    <td className="table-td text-gray-600">{emp.location?.name || '—'}</td>
                    <td className="table-td">
                      <div className="text-xs text-gray-500">
                        {emp.email && <p>{emp.email}</p>}
                        {emp.phone && <p>{emp.phone}</p>}
                        {!emp.email && !emp.phone && '—'}
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="badge bg-blue-100 text-blue-700">{emp._count?.issuedAssets || 0}</span>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${emp.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/employees/${emp.id}`} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {canEdit && (
                          <button onClick={() => { setEditEmployee(emp); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => setDeleteId(emp.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-600">
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
        <EmployeeModal
          employee={editEmployee}
          departments={departments}
          locations={locations}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchEmployees(); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Employee"
        message="Are you sure you want to delete this employee?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  );
}
