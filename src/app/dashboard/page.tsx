'use client';

import { useEffect, useState } from 'react';
import {
  Package, CheckCircle, ArrowRightLeft, AlertTriangle,
  Wrench, ArrowLeftRight, TrendingDown, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDate } from '@/lib/utils';

interface DashboardData {
  stats: {
    totalAssets: number;
    availableAssets: number;
    issuedAssets: number;
    damagedAssets: number;
    underRepairAssets: number;
    transferredAssets: number;
    lowStockCount: number;
  };
  categoryChartData: { name: string; count: number }[];
  recentActivity: {
    id: string;
    actionType: string;
    description: string;
    createdAt: string;
    user?: { name: string };
  }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

const statCards = [
  { key: 'totalAssets', label: 'Total Assets', icon: Package, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
  { key: 'availableAssets', label: 'Available', icon: CheckCircle, color: 'bg-green-50 text-green-600', border: 'border-green-100' },
  { key: 'issuedAssets', label: 'Issued', icon: ArrowRightLeft, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
  { key: 'damagedAssets', label: 'Damaged', icon: AlertTriangle, color: 'bg-red-50 text-red-600', border: 'border-red-100' },
  { key: 'underRepairAssets', label: 'Under Repair', icon: Wrench, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
  { key: 'transferredAssets', label: 'Transferred', icon: ArrowLeftRight, color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
  { key: 'lowStockCount', label: 'Low Stock', icon: TrendingDown, color: 'bg-yellow-50 text-yellow-600', border: 'border-yellow-100' },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3" />
              <div className="h-6 bg-gray-200 rounded mb-1" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statusChartData = data ? [
    { name: 'Available', value: data.stats.availableAssets, color: '#10b981' },
    { name: 'Issued', value: data.stats.issuedAssets, color: '#3b82f6' },
    { name: 'Damaged', value: data.stats.damagedAssets, color: '#ef4444' },
    { name: 'Repair', value: data.stats.underRepairAssets, color: '#f97316' },
    { name: 'Transferred', value: data.stats.transferredAssets, color: '#8b5cf6' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map(({ key, label, icon: Icon, color, border }) => (
          <div key={key} className={`card p-5 border ${border}`}>
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {data?.stats[key as keyof typeof data.stats] ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Bar Chart */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Assets by Category</h3>
          {data?.categoryChartData?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.categoryChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data available</div>
          )}
        </div>

        {/* Status Pie Chart */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Asset Status Distribution</h3>
          {statusChartData.length ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie data={statusChartData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {statusChartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-xs text-gray-600">{item.name}</span>
                    <span className="text-xs font-semibold text-gray-900 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data available</div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {data?.recentActivity?.length ? (
            data.recentActivity.map((log) => (
              <div key={log.id} className="px-6 py-3 flex items-start gap-3">
                <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{log.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {log.user && <span className="text-xs text-gray-500">{log.user.name}</span>}
                    <span className="text-xs text-gray-400">{formatDate(log.createdAt)}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">
                  {log.actionType}
                </span>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
}
