'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { FileText, Download, Filter } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatCurrency, exportToCSV } from '@/lib/utils';

const REPORT_TYPES = [
  { value: 'all', label: 'All Assets' },
  { value: 'available', label: 'Available Stock' },
  { value: 'issued', label: 'Issued Assets' },
  { value: 'damaged', label: 'Damaged Assets' },
  { value: 'repairs', label: 'Repair Records' },
  { value: 'transfers', label: 'Transfer History' },
  { value: 'low-stock', label: 'Low Stock' },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('all');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories);
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: reportType, categoryId, startDate, endDate });
    const r = await fetch(`/api/reports?${params}`);
    const d = await r.json();
    setData(d.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [reportType, categoryId, startDate, endDate]);

  const handleExport = () => {
    if (!data.length) return;
    let rows: any[] = [];

    if (reportType === 'all' || reportType === 'available' || reportType === 'damaged') {
      rows = data.map((a: any) => ({
        'Asset Name': a.assetName, 'Asset Tag': a.assetTag,
        'Serial Number': a.serialNumber, 'Category': a.category?.name || '',
        'Brand': a.brand || '', 'Model': a.model || '',
        'Status': a.status, 'Location': a.location?.name || '',
        'Purchase Date': formatDate(a.purchaseDate), 'Price': a.purchasePrice || '',
      }));
    } else if (reportType === 'issued') {
      rows = data.map((i: any) => ({
        'Asset': i.asset?.assetName, 'Tag': i.asset?.assetTag,
        'Employee': i.employee?.name, 'Dept': i.employee?.department?.name || '',
        'Issue Date': formatDate(i.issueDate),
        'Expected Return': i.expectedReturnDate ? formatDate(i.expectedReturnDate) : '',
        'Issued By': i.issuedBy?.name,
      }));
    } else if (reportType === 'transfers') {
      rows = data.map((t: any) => ({
        'Asset': t.asset?.assetName, 'From': t.fromLocation?.name || '',
        'To': t.toLocation?.name || '', 'Date': formatDate(t.transferDate),
        'By': t.transferredBy?.name, 'Received By': t.receivedBy || '',
      }));
    } else if (reportType === 'repairs') {
      rows = data.map((r: any) => ({
        'Asset': r.asset?.assetName, 'Issue': r.issueDescription,
        'Vendor': r.repairVendor || '', 'Sent': formatDate(r.sentDate),
        'Status': r.status, 'Cost': r.repairCost || '',
      }));
    } else if (reportType === 'low-stock') {
      rows = data.map((c: any) => ({
        'Category': c.name, 'Available Assets': c._count?.assets || 0,
      }));
    }

    exportToCSV(rows, `report-${reportType}`);
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="p-8 text-center text-gray-400">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          Loading report...
        </div>
      );
    }
    if (!data.length) {
      return (
        <div className="p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">No data for this report</p>
        </div>
      );
    }

    if (reportType === 'all' || reportType === 'available' || reportType === 'damaged') {
      return (
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Asset</th>
              <th className="table-th">Category</th>
              <th className="table-th">Location</th>
              <th className="table-th">Status</th>
              <th className="table-th">Purchase Date</th>
              <th className="table-th">Price</th>
              <th className="table-th">Assigned To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((a: any) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="table-td">
                  <p className="font-medium text-gray-900">{a.assetName}</p>
                  <p className="text-xs text-gray-500 font-mono">{a.assetTag}</p>
                </td>
                <td className="table-td text-gray-600">{a.category?.name || '—'}</td>
                <td className="table-td text-gray-600">{a.location?.name || '—'}</td>
                <td className="table-td"><StatusBadge status={a.status} /></td>
                <td className="table-td text-gray-600">{formatDate(a.purchaseDate)}</td>
                <td className="table-td text-gray-600">{formatCurrency(a.purchasePrice)}</td>
                <td className="table-td text-gray-600">{a.issues?.[0]?.employee?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (reportType === 'issued') {
      return (
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Asset</th>
              <th className="table-th">Employee</th>
              <th className="table-th">Department</th>
              <th className="table-th">Issue Date</th>
              <th className="table-th">Expected Return</th>
              <th className="table-th">Issued By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((i: any) => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="table-td">
                  <p className="font-medium text-gray-900">{i.asset?.assetName}</p>
                  <p className="text-xs text-gray-500">{i.asset?.assetTag}</p>
                </td>
                <td className="table-td">
                  <p className="font-medium text-gray-900">{i.employee?.name}</p>
                  <p className="text-xs text-gray-500">{i.employee?.employeeId}</p>
                </td>
                <td className="table-td text-gray-600">{i.employee?.department?.name || '—'}</td>
                <td className="table-td text-gray-600">{formatDate(i.issueDate)}</td>
                <td className="table-td text-gray-600">{i.expectedReturnDate ? formatDate(i.expectedReturnDate) : '—'}</td>
                <td className="table-td text-gray-600">{i.issuedBy?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (reportType === 'transfers') {
      return (
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Asset</th>
              <th className="table-th">From</th>
              <th className="table-th">To</th>
              <th className="table-th">Date</th>
              <th className="table-th">By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="table-td">
                  <p className="font-medium text-gray-900">{t.asset?.assetName}</p>
                  <p className="text-xs text-gray-500">{t.asset?.assetTag}</p>
                </td>
                <td className="table-td text-gray-600">{t.fromLocation?.name || '—'}</td>
                <td className="table-td font-medium text-gray-900">{t.toLocation?.name || '—'}</td>
                <td className="table-td text-gray-600">{formatDate(t.transferDate)}</td>
                <td className="table-td text-gray-600">{t.transferredBy?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (reportType === 'repairs') {
      return (
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Asset</th>
              <th className="table-th">Issue</th>
              <th className="table-th">Vendor</th>
              <th className="table-th">Sent Date</th>
              <th className="table-th">Status</th>
              <th className="table-th">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="table-td">
                  <p className="font-medium text-gray-900">{r.asset?.assetName}</p>
                  <p className="text-xs text-gray-500">{r.asset?.assetTag}</p>
                </td>
                <td className="table-td text-gray-600 max-w-xs truncate">{r.issueDescription}</td>
                <td className="table-td text-gray-600">{r.repairVendor || '—'}</td>
                <td className="table-td text-gray-600">{formatDate(r.sentDate)}</td>
                <td className="table-td">
                  <span className="badge bg-orange-100 text-orange-700">{r.status.replace(/_/g, ' ')}</span>
                </td>
                <td className="table-td text-gray-600">{r.repairCost ? formatCurrency(r.repairCost) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (reportType === 'low-stock') {
      return (
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Category</th>
              <th className="table-th">Available Assets</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="table-td font-medium text-gray-900">{c.name}</td>
                <td className="table-td">
                  <span className="text-2xl font-bold text-red-600">{c._count?.assets || 0}</span>
                </td>
                <td className="table-td">
                  <span className="badge bg-red-100 text-red-700">Low Stock</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500">{data.length} records</p>
        </div>
        <button onClick={handleExport} className="btn-secondary" disabled={!data.length}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={reportType} onChange={e => setReportType(e.target.value)} className="input-field">
            {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input-field">
            <option value="">All Categories</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="input-field" placeholder="Start date" />
          </div>
          <div>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="input-field" placeholder="End date" />
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {REPORT_TYPES.find(t => t.value === reportType)?.label}
          </h3>
          <span className="text-xs text-gray-400">{data.length} records</span>
        </div>
        <div className="overflow-x-auto">
          {renderTable()}
        </div>
      </div>
    </div>
  );
}
