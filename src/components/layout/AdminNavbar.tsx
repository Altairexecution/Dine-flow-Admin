import React from 'react';
import { Menu, ShieldCheck, Database } from 'lucide-react';
import { isFirebaseConfigured } from '../../lib/firebase';
import { useAdminAuth } from '../../context/AdminAuthContext';

export interface AdminNavbarProps {
  onOpenMobileMenu?: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ onOpenMobileMenu }) => {
  const { user } = useAdminAuth();

  return (
    <header className="sticky top-0 z-20 bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Platform Operations</span>
            {isFirebaseConfigured ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-bold border border-emerald-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Firebase Connected
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 text-[10px] font-bold border border-amber-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Local Mode
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Multi-Tenant Restaurant Fleet Management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-purple-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Operator: {user?.email || 'admin@dineflow.io'}</span>
        </div>
      </div>
    </header>
  );
};
