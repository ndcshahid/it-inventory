'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard, Package, Users, ArrowRightLeft,
  Wrench, FileText, Settings, Activity, Monitor,
  ChevronRight, Building2, MapPin, Tags, ArrowLeftRight,
  RotateCcw, ShieldCheck
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Package },
  { href: '/dashboard/employees', label: 'Employees', icon: Users },
  { href: '/dashboard/issues', label: 'Issue Asset', icon: ArrowRightLeft },
  { href: '/dashboard/returns', label: 'Return Asset', icon: RotateCcw },
  { href: '/dashboard/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { href: '/dashboard/repairs', label: 'Repairs', icon: Wrench },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/activity-logs', label: 'Activity Logs', icon: Activity },
];

const adminItems = [
  { href: '/dashboard/users', label: 'Users', icon: ShieldCheck },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-slate-900 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Monitor className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">IT Inventory</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Management System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Main Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${active ? 'active' : 'text-slate-400 hover:text-white'}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {(role === 'ADMIN') && (
          <>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-5">Administration</p>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-item ${active ? 'active' : 'text-slate-400 hover:text-white'}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User info at bottom */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
            <p className="text-xs text-slate-400">{role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
