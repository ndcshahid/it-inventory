'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { LogOut, Bell, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/inventory': 'Inventory',
  '/dashboard/employees': 'Employees',
  '/dashboard/issues': 'Issue Asset',
  '/dashboard/returns': 'Return Asset',
  '/dashboard/transfers': 'Transfers',
  '/dashboard/repairs': 'Repairs',
  '/dashboard/reports': 'Reports',
  '/dashboard/activity-logs': 'Activity Logs',
  '/dashboard/users': 'User Management',
  '/dashboard/settings': 'Settings',
};

export function TopNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || (key !== '/dashboard' && pathname.startsWith(key))
  )?.[1] ?? 'Dashboard';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 leading-none">{session?.user?.name}</p>
              <p className="text-xs text-gray-500">{session?.user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
