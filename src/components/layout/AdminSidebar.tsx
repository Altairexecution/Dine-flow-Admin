import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Users,
  Zap,
  Shield,
  Settings,
  ExternalLink,
  Server,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAdminAuth } from '../../context/AdminAuthContext';

export interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const { logout, user } = useAdminAuth();

  const navItems = [
    { name: 'Platform Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Restaurants & Tenants', path: '/restaurants', icon: Store },
    { name: 'Platform Users', path: '/users', icon: Users },
    { name: 'Automation Telemetry', path: '/automation', icon: Zap },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  const dineflowAppUrl = import.meta.env.VITE_DINEFLOW_APP_URL || 'https://dineflowv1.vercel.app';

  return (
    <aside className="w-64 bg-[#0D1322] border-r border-slate-800 flex flex-col h-screen select-none shrink-0 sticky top-0 z-30">
      {/* Brand Header */}
      <div className="p-6 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              DineFlow <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">Admin</span>
            </h1>
            <p className="text-[10px] font-mono text-slate-400 -mt-0.5 tracking-tight">
              Spark Scale Control Plane
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Management
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Live Restaurant App Link */}
        <div className="pt-4 mt-4 border-t border-slate-800/80">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Target Deployment
          </p>
          <a
            href={dineflowAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-purple-300 hover:bg-slate-800/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>DineFlow SaaS App</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0A0E1A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-purple-900/60 text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-700/60">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@dineflow.io'}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
