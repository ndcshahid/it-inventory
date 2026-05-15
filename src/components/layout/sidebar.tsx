'use client';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, Users, ArrowRightLeft,
  Wrench, FileText, Settings, Activity, Monitor,
  ArrowLeftRight,
  RotateCcw, ShieldCheck, ChevronLeft, ChevronRight,
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setCollapsed(saved === 'true');
  }, []);

  const toggle = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} bg-slate-900 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out relative`}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-white/10 h-[69px] ${collapsed ? 'justify-center px-0' : 'gap-3 px-5'}`}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Monitor className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight whitespace-nowrap">IT Inventory</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider whitespace-nowrap">Management System</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-[52px] z-10 w-6 h-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-colors shadow-md"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Main Menu</p>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`sidebar-nav-item ${active ? 'active' : 'text-slate-400 hover:text-white'} ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {role === 'ADMIN' && (
          <>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-5">Administration</p>
            )}
            {collapsed && <div className="my-3 border-t border-white/10" />}
            {adminItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`sidebar-nav-item ${active ? 'active' : 'text-slate-400 hover:text-white'} ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="px-2 py-4 border-t border-white/10">
        <div className={`flex items-center gap-3 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <div
            className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
            title={collapsed ? session?.user?.name || '' : undefined}
          >
            <span className="text-white text-xs font-semibold">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
              <p className="text-xs text-slate-400">{role?.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
