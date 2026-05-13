import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function generateAssetTag(category: string): string {
  const prefix = category.substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `TAG-${prefix}-${random}`;
}

export const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  TRANSFERRED: 'bg-purple-100 text-purple-800',
  UNDER_REPAIR: 'bg-orange-100 text-orange-800',
  DAMAGED: 'bg-red-100 text-red-800',
  LOST: 'bg-gray-100 text-gray-800',
  RETIRED: 'bg-slate-100 text-slate-800',
};

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  ISSUED: 'Issued',
  TRANSFERRED: 'Transferred',
  UNDER_REPAIR: 'Under Repair',
  DAMAGED: 'Damaged',
  LOST: 'Lost',
  RETIRED: 'Retired',
};

export const CONDITION_LABELS: Record<string, string> = {
  NEW: 'New',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
  DAMAGED: 'Damaged',
};

export const REPAIR_STATUS_LABELS: Record<string, string> = {
  SENT_FOR_REPAIR: 'Sent for Repair',
  IN_PROGRESS: 'In Progress',
  REPAIRED: 'Repaired',
  NOT_REPAIRABLE: 'Not Repairable',
};

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') ? `"${str}"` : str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
