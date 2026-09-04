import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { adminDb } from '../../lib/dbAdapter';
import { isFirebaseConfigured } from '../../lib/firebase';
import { Restaurant } from '../../types/restaurant';
import { UserProfile } from '../../types/auth';
import { AutomationLog } from '../../types/event';
import { CreateRestaurantModal } from '../restaurants/CreateRestaurantModal';
import {
  Store,
  Users,
  CalendarCheck,
  Zap,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Server,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboardOverviewPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [totalBookings, setTotalBookings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  const loadPlatformData = async () => {
    setIsLoading(true);
    try {
      const [restList, userList, logList, bookingList] = await Promise.all([
        adminDb.queryDocs<Restaurant>('restaurants', { orderByField: 'createdAt', orderDirection: 'desc' }),
        adminDb.queryDocs<UserProfile>('users'),
        adminDb.queryDocs<AutomationLog>('automationLogs', { limitCount: 50, orderByField: 'timestamp', orderDirection: 'desc' }),
        adminDb.queryDocs('bookings'),
      ]);

      setRestaurants(restList);
      setUsers(userList);
      setAutomationLogs(logList);
      setTotalBookings(bookingList.length);
    } catch (err) {
      console.error('[Admin Overview] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  const activeRestaurants = restaurants.filter((r) => r.status === 'active');
  const suspendedRestaurants = restaurants.filter((r) => r.status === 'suspended');

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Platform Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cross-tenant telemetry & fleet management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Register Restaurant Tenant
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glow className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Restaurants</span>
            <div className="w-8 h-8 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{restaurants.length}</span>
              <span className="text-xs font-semibold text-emerald-400">
                {activeRestaurants.length} active
              </span>
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            {suspendedRestaurants.length > 0 ? `${suspendedRestaurants.length} suspended` : 'All tenants active'}
          </p>
        </Card>

        <Card glow className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Users</span>
            <div className="w-8 h-8 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{users.length}</span>
              <span className="text-xs font-semibold text-slate-400">Accounts</span>
            </div>
          )}
          <p className="text-[11px] text-slate-500">Owners, Managers & Staff</p>
        </Card>

        <Card glow className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{totalBookings}</span>
              <span className="text-xs font-semibold text-emerald-400">Recorded</span>
            </div>
          )}
          <p className="text-[11px] text-slate-500">Across all active restaurants</p>
        </Card>

        <Card glow className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Automations Dispatched</span>
            <div className="w-8 h-8 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{automationLogs.length}</span>
              <span className="text-xs font-semibold text-amber-400">Webhooks</span>
            </div>
          )}
          <p className="text-[11px] text-slate-500">Single n8n integration layer</p>
        </Card>
      </div>

      {/* Infrastructure Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Recent Restaurant Tenants</h3>
              <p className="text-xs text-slate-500">Fleet overview and tenant status</p>
            </div>
            <Link
              to="/restaurants"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl">
              <Store className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-400">No restaurants registered yet.</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Click "Register Restaurant Tenant" to create your first client.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold">
                    <th className="pb-3">Restaurant</th>
                    <th className="pb-3">Slug</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {restaurants.slice(0, 5).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-semibold text-slate-200 flex items-center gap-2.5">
                        <img src={r.logo} alt={r.name} className="w-7 h-7 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-white leading-tight">{r.name}</p>
                          <p className="text-[10px] text-slate-500">{r.city || 'Austin, TX'}</p>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-purple-300 text-[11px]">/r/{r.slug}</td>
                      <td className="py-3 text-slate-400">{r.ownerEmail || '—'}</td>
                      <td className="py-3">
                        <Badge variant={r.status === 'active' ? 'success' : 'danger'} size="sm">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/restaurants`}
                          className="text-purple-400 hover:text-purple-300 font-bold"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* System Health Card */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">System Architecture Health</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Cloud Firestore</p>
                  <p className="text-[10px] text-slate-500">Project: dine-flow-v1</p>
                </div>
              </div>
              <Badge variant={isFirebaseConfigured ? 'success' : 'warning'} size="sm">
                {isFirebaseConfigured ? 'Online' : 'Local'}
              </Badge>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Firebase Auth</p>
                  <p className="text-[10px] text-slate-500">Identity & RBAC</p>
                </div>
              </div>
              <Badge variant={isFirebaseConfigured ? 'success' : 'warning'} size="sm">
                {isFirebaseConfigured ? 'Verified' : 'Local'}
              </Badge>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-200">n8n Automation</p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[130px]">sparkscale.app.n8n.cloud</p>
                </div>
              </div>
              <Badge variant="blue" size="sm">
                Active
              </Badge>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Super Admin Control Plane operates as an independent management application connected to the shared Firebase and n8n backend.
            </p>
          </div>
        </Card>
      </div>

      {/* Create Restaurant Modal */}
      <CreateRestaurantModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          loadPlatformData();
        }}
      />
    </div>
  );
};
