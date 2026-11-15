import {
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Salad,
  ShoppingBag,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface DashboardLayoutProps {
  title: string;
  breadcrumb: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function DashboardLayout({
  title,
  breadcrumb,
  action,
  children,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  const links = isAdmin
    ? [
        { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/admin/members', label: 'Manage Members', icon: Users, end: false },
        { to: '/admin/orders', label: 'Manage Orders', icon: ClipboardList, end: false },
        { to: '/admin/menu', label: 'Manage Menu', icon: UtensilsCrossed, end: false },
      ]
    : [
        { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/orders', label: 'My Orders', icon: ShoppingBag, end: false },
        { to: '/subscription', label: 'My Subscription', icon: CalendarCheck, end: false },
        { to: '/builder', label: 'Salad Builder', icon: Salad, end: false },
      ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation (240px) */}
        <aside className="w-full lg:w-[240px] shrink-0">
          <div className="bg-white border border-[#DDE4DA] rounded-xl p-4">
            <div className="pb-4 mb-4 border-b border-[#E8EDE5]">
              <p className="text-xs text-[#647469]">{isAdmin ? 'Admin Console' : 'Member Portal'}</p>
              <p className="text-sm font-semibold text-[#1A241E] mt-0.5 truncate">{user?.name}</p>
              <p className="text-xs text-[#526056] truncate">{user?.email}</p>
            </div>

            <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
              {links.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#EDF5EE] text-[#166534]'
                          : 'text-[#4A584E] hover:bg-[#F4F7F2] hover:text-[#1A241E]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 mt-4 border-t border-[#E8EDE5]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#526056] hover:bg-[#FEF2F2] hover:text-[#B91C1C] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace Viewport */}
        <main className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#DDE4DA]">
            <div>
              <p className="text-xs text-[#647469]">{breadcrumb}</p>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1A241E] mt-1">
                {title}
              </h1>
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
