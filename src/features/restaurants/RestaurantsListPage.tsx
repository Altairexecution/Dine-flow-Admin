import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Restaurant } from '../../types/restaurant';
import { adminDb } from '../../lib/dbAdapter';
import { useToast } from '../../context/ToastContext';
import { CreateRestaurantModal } from './CreateRestaurantModal';
import { EditRestaurantModal } from './EditRestaurantModal';
import {
  Store,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Power,
  SlidersHorizontal,
} from 'lucide-react';

export const RestaurantsListPage: React.FC = () => {
  const toast = useToast();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  const dineflowAppUrl = import.meta.env.VITE_DINEFLOW_APP_URL || 'https://dineflowv1.vercel.app';

  const loadRestaurants = async () => {
    setIsLoading(true);
    try {
      const list = await adminDb.queryDocs<Restaurant>('restaurants', {
        orderByField: 'createdAt',
        orderDirection: 'desc',
      });
      setRestaurants(list);
    } catch (err) {
      console.error('[Admin Restaurants] Error loading restaurants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const handleToggleStatus = async (r: Restaurant) => {
    const newStatus = r.status === 'active' ? 'suspended' : 'active';
    try {
      await adminDb.updateDoc<Restaurant>('restaurants', r.id, { status: newStatus });
      toast.success(
        newStatus === 'active' ? 'Tenant Activated' : 'Tenant Suspended',
        `"${r.name}" is now ${newStatus}.`
      );
      loadRestaurants();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error('Error', msg);
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.email && r.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.city && r.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Restaurant Tenants</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage multi-tenant restaurant fleet, status, and configurations
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Register Restaurant Tenant
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by restaurant name, slug, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-semibold">
            {(['all', 'active', 'suspended'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition-all capitalize ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Directory Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Store className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-300">No restaurants match your filters</h4>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Click "Register Restaurant Tenant" to add a new client.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Restaurant</th>
                  <th className="py-3.5 px-4">Slug / Link</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRestaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={r.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&h=160&fit=crop&q=80'}
                          alt={r.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white text-sm leading-tight">{r.name}</p>
                          <p className="text-[11px] text-slate-400">{r.address}, {r.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <a
                        href={`${dineflowAppUrl}/r/${r.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-purple-300 hover:text-purple-200 bg-purple-950/40 border border-purple-800/50 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors"
                      >
                        <span>/r/{r.slug}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-4 px-4 text-slate-300 space-y-0.5">
                      <p className="font-medium">{r.phone || '—'}</p>
                      <p className="text-[11px] text-slate-500">{r.email || '—'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={r.status === 'active' ? 'success' : 'danger'} size="sm">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingRestaurant(r)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(r)}
                          title={r.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            r.status === 'active'
                              ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50'
                              : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreateRestaurantModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          loadRestaurants();
        }}
      />

      <EditRestaurantModal
        restaurant={editingRestaurant}
        isOpen={Boolean(editingRestaurant)}
        onClose={() => setEditingRestaurant(null)}
        onSaved={() => {
          setEditingRestaurant(null);
          loadRestaurants();
        }}
      />
    </div>
  );
};
