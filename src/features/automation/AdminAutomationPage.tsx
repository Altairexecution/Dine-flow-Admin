import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { AutomationLog } from '../../types/event';
import { adminDb } from '../../lib/dbAdapter';
import { Zap, RefreshCw, Radio } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AdminAutomationPage: React.FC = () => {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const list = await adminDb.queryDocs<AutomationLog>('automationLogs', {
        orderByField: 'timestamp',
        orderDirection: 'desc',
        limitCount: 100,
      });
      setLogs(list);
    } catch (err) {
      console.error('[Admin Automation] Error loading logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Automation Telemetry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Global stream of business events dispatched from DineFlow to the single n8n webhook
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={loadLogs}
          leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Feed
        </Button>
      </div>

      {/* Connection Info Banner */}
      <Card className="p-4 bg-[#0F172A] border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">Single Automation Endpoint:</span>
              <span className="text-xs font-mono text-purple-300">https://sparkscale.app.n8n.cloud/webhook/dineflow</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Signed with HMAC-SHA256 headers (`X-DineFlow-Signature`, `X-DineFlow-Event`, `X-DineFlow-Idempotency-Key`).
            </p>
          </div>
        </div>
        <Badge variant="success" size="sm">
          Contract Active
        </Badge>
      </Card>

      {/* Logs Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Zap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-300">No automation events recorded yet</h4>
            <p className="text-xs text-slate-500 mt-1">
              Events dispatched when guests book or cancel reservations in DineFlow will appear in this real-time feed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-4">Event Type</th>
                  <th className="py-3.5 px-4">Tenant ID</th>
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">HTTP Status</th>
                  <th className="py-3.5 px-5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 font-mono text-[11px]">
                    <td className="py-3.5 px-5 text-slate-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-bold text-white">{log.eventType}</td>
                    <td className="py-3.5 px-4 text-purple-300">{log.restaurantId}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-sans">
                      {log.recipientName} ({log.recipientPhone})
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{log.responseStatus || 200}</td>
                    <td className="py-3.5 px-5 font-sans">
                      <Badge
                        variant={log.status === 'SUCCESS' ? 'success' : log.status === 'TEST_MODE' ? 'warning' : 'danger'}
                        size="sm"
                      >
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
