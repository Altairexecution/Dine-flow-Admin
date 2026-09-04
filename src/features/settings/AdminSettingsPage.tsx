import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { isFirebaseConfigured } from '../../lib/firebase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Settings, Server, Shield, Database, Radio } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAdminAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">System Settings & Architecture</h1>
        <p className="text-xs text-slate-400 mt-1">
          Infrastructure parameters for the DineFlow Control Plane
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend Connectivity */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Database className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">Firebase Backend Status</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Project ID:</span>
              <span className="font-mono text-purple-300 font-bold">dine-flow-v1</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Connection State:</span>
              <Badge variant={isFirebaseConfigured ? 'success' : 'warning'} size="sm">
                {isFirebaseConfigured ? 'Production (Connected)' : 'Local Configuration'}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Database Engine:</span>
              <span className="text-slate-200">Cloud Firestore</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Identity Provider:</span>
              <span className="text-slate-200">Firebase Authentication</span>
            </div>
          </div>
        </Card>

        {/* Automation Endpoint */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Radio className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">Automation Engine</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Engine Type:</span>
              <span className="text-slate-200">n8n Cloud Workflow Server</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Target Webhook:</span>
              <span className="font-mono text-purple-300 truncate max-w-[200px]">https://sparkscale.app.n8n.cloud/webhook/dineflow</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Signing Protocol:</span>
              <span className="text-slate-200">HMAC-SHA256 Payload Hash</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Idempotency:</span>
              <span className="text-emerald-400 font-bold">Enabled</span>
            </div>
          </div>
        </Card>

        {/* Operator Profile */}
        <Card className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Shield className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">Active Operator Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <p className="text-slate-500 font-medium">Operator Email</p>
              <p className="text-white font-bold text-sm mt-1">{user?.email || 'admin@dineflow.io'}</p>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <p className="text-slate-500 font-medium">Access Tier</p>
              <p className="text-purple-400 font-bold text-sm mt-1">SUPER_ADMIN (Global Fleet)</p>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <p className="text-slate-500 font-medium">Platform Role Scope</p>
              <p className="text-emerald-400 font-bold text-sm mt-1">Full Control Plane</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
