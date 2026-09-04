import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Restaurant } from '../../types/restaurant';
import { UserProfile } from '../../types/auth';
import { adminDb } from '../../lib/dbAdapter';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Store, Users, ExternalLink, Mail, Phone, MapPin, Power } from 'lucide-react';
import { CreateUserModal } from '../users/CreateUserModal';

export const RestaurantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const dineflowAppUrl = import.meta.env.VITE_DINEFLOW_APP_URL || 'https://dineflowv1.vercel.app';

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const rest = await adminDb.getDoc<Restaurant>('restaurants', id);
      const userList = await adminDb.queryDocs<UserProfile>('users', {
        filters: [{ field: 'restaurantId', op: '==', value: id }],
      });
      setRestaurant(rest);
      setUsers(userList);
    } catch (err) {
      console.error('[Admin Restaurant Detail] Error loading tenant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!restaurant) return;
    const newStatus = restaurant.status === 'active' ? 'suspended' : 'active';
    try {
      await adminDb.updateDoc<Restaurant>('restaurants', restaurant.id, { status: newStatus });
      toast.success(newStatus === 'active' ? 'Tenant Activated' : 'Tenant Suspended');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      toast.error('Error', msg);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <h3 className="text-base font-bold text-slate-300">Restaurant Tenant Not Found</h3>
        <Link to="/restaurants" className="text-xs text-purple-400 font-bold hover:underline mt-2 inline-block">
          ← Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Title */}
      <div className="flex items-center justify-between">
        <Link
          to="/restaurants"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Restaurants</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button
            variant={restaurant.status === 'active' ? 'danger' : 'secondary'}
            size="sm"
            onClick={handleToggleStatus}
            leftIcon={<Power className="w-3.5 h-3.5" />}
          >
            {restaurant.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}
          </Button>
          <a
            href={`${dineflowAppUrl}/r/${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 text-purple-300 border border-purple-800/50 text-xs font-bold hover:bg-purple-900/40 transition-colors"
          >
            <span>Live Public Page</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Tenant Hero Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-800">
          <img
            src={restaurant.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&h=160&fit=crop&q=80'}
            alt={restaurant.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/30 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white truncate">{restaurant.name}</h2>
              <Badge variant={restaurant.status === 'active' ? 'success' : 'danger'} size="sm">
                {restaurant.status}
              </Badge>
            </div>
            <p className="text-xs font-mono text-purple-300 mt-0.5">ID: {restaurant.id} • Slug: /r/{restaurant.slug}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {restaurant.address}, {restaurant.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                {restaurant.phone || '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {restaurant.email || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Staff and Accounts */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Provisioned Restaurant Accounts</h4>
              <p className="text-xs text-slate-500">Users authorized to access this tenant in DineFlow</p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateUserOpen(true)}
              leftIcon={<Users className="w-3.5 h-3.5" />}
            >
              + Add User Account
            </Button>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500">No staff accounts provisioned yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">UID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/20">
                      <td className="py-3 font-semibold text-slate-200">{u.name}</td>
                      <td className="py-3 text-slate-300 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3">
                        <Badge
                          variant={u.role === 'OWNER' ? 'purple' : u.role === 'MANAGER' ? 'blue' : 'neutral'}
                          size="sm"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-500 font-mono text-[10px]">{u.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Provision User Modal */}
      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        initialRestaurantId={restaurant.id}
        initialRestaurantName={restaurant.name}
        onCreated={() => {
          setIsCreateUserOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
