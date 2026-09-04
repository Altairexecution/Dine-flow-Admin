import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { UserProfile } from '../../types/auth';
import { Restaurant } from '../../types/restaurant';
import { adminDb } from '../../lib/dbAdapter';
import { CreateUserModal } from './CreateUserModal';
import { Users, Plus, Search, Shield, Building2 } from 'lucide-react';

export const UsersListPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [restaurants, setRestaurants] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF'>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userList, restList] = await Promise.all([
        adminDb.queryDocs<UserProfile>('users'),
        adminDb.queryDocs<Restaurant>('restaurants'),
      ]);

      const restMap: Record<string, string> = {};
      restList.forEach((r) => {
        restMap[r.id] = r.name;
      });

      setUsers(userList);
      setRestaurants(restMap);
    } catch (err) {
      console.error('[Admin Users] Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (restaurants[u.restaurantId] || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Platform Users</h1>
          <p className="text-xs text-slate-400 mt-1">
            Global directory of provisioned accounts across all restaurant tenants
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Provision User Account
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by name, email, restaurant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto">
          {(['ALL', 'SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-lg transition-all ${
                roleFilter === r
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === 'SUPER_ADMIN' ? 'Admin' : r}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-300">No users found</h4>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Click "Provision User Account" to add staff accounts.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Assigned Tenant</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">UID</th>
                  <th className="py-3.5 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs ring-1 ring-slate-700">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <span className="font-bold text-white text-sm">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300 text-[11px]">{u.email}</td>
                    <td className="py-4 px-4 text-slate-300">
                      {u.role === 'SUPER_ADMIN' ? (
                        <span className="text-purple-400 font-semibold flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Platform Global
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {restaurants[u.restaurantId] || u.restaurantId}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          u.role === 'SUPER_ADMIN'
                            ? 'purple'
                            : u.role === 'OWNER'
                            ? 'warning'
                            : u.role === 'MANAGER'
                            ? 'blue'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 font-mono text-[10px] text-slate-500">{u.id}</td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
