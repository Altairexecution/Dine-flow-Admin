import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { adminApiClient } from '../../lib/adminApiClient';
import { adminDb } from '../../lib/dbAdapter';
import { useToast } from '../../context/ToastContext';
import { generateRandomPassword } from '../../lib/utils';
import { Restaurant } from '../../types/restaurant';
import { Lock, Copy, Check, Sparkles, UserPlus, AlertCircle } from 'lucide-react';

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialRestaurantId?: string;
  initialRestaurantName?: string;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialRestaurantId,
  initialRestaurantName,
}) => {
  const toast = useToast();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestId, setSelectedRestId] = useState(initialRestaurantId || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'OWNER' | 'MANAGER' | 'STAFF'>('MANAGER');
  const [temporaryPassword, setTemporaryPassword] = useState(generateRandomPassword(12));
  const [isLoading, setIsLoading] = useState(false);

  const [provisionedCreds, setProvisionedCreds] = useState<{ email: string; pass: string; role: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      adminDb.queryDocs<Restaurant>('restaurants').then((list) => {
        setRestaurants(list);
        if (!selectedRestId && list.length > 0) {
          setSelectedRestId(list[0].id);
        }
      });
      setTemporaryPassword(generateRandomPassword(12));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !selectedRestId) {
      toast.error('Missing fields', 'Please provide name, email, and select a restaurant.');
      return;
    }

    const selectedRest = restaurants.find((r) => r.id === selectedRestId);
    const restName = selectedRest?.name || initialRestaurantName || 'Restaurant';

    setIsLoading(true);
    try {
      await adminApiClient.provisionUser({
        restaurantId: selectedRestId,
        restaurantName: restName,
        name: name.trim(),
        email: email.trim(),
        role,
        temporaryPassword,
      });

      toast.success('Account Provisioned', `User account for ${name} has been created.`);
      setProvisionedCreds({
        email: email.trim(),
        pass: temporaryPassword,
        role,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Provisioning failed';
      toast.error('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!provisionedCreds) return;
    const text = `DineFlow Account Credentials:\nPortal: https://dineflowv1.vercel.app/login\nEmail: ${provisionedCreds.email}\nTemporary Password: ${provisionedCreds.pass}\nRole: ${provisionedCreds.role}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    toast.info('Copied to Clipboard');
  };

  const handleDone = () => {
    setProvisionedCreds(null);
    setName('');
    setEmail('');
    setRole('MANAGER');
    setTemporaryPassword(generateRandomPassword(12));
    onCreated();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={provisionedCreds ? handleDone : onClose}
      title={provisionedCreds ? 'Account Provisioned' : 'Provision Restaurant User Account'}
      description={
        provisionedCreds
          ? 'Securely provide these credentials to the user.'
          : 'Create a real authenticated account with tenant-bound role authorization.'
      }
      maxWidth="lg"
    >
      {provisionedCreds ? (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#09101F] border border-purple-500/30 space-y-4">
            <div className="flex items-center gap-2 text-purple-300">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h4 className="text-sm font-bold">New Account Credentials</h4>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Login Portal:</span>
                <span className="text-purple-300 font-bold">https://dineflowv1.vercel.app/login</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Email:</span>
                <span className="text-white font-bold">{provisionedCreds.email}</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Temporary Password:</span>
                <span className="text-emerald-400 font-bold">{provisionedCreds.pass}</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Assigned Role:</span>
                <span className="text-blue-300 font-bold">{provisionedCreds.role}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Login Instruction:</strong> The user must sign in using their <strong>Email Address</strong> ({provisionedCreds.email}), NOT the user ID or restaurant ID.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={handleCopyCredentials}
              leftIcon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied' : 'Copy Credentials'}
            </Button>
            <Button onClick={handleDone}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!initialRestaurantId && (
            <Select
              label="Assigned Restaurant Tenant *"
              value={selectedRestId}
              onChange={(e) => setSelectedRestId(e.target.value)}
              options={restaurants.map((r) => ({
                value: r.id,
                label: `${r.name} (${r.city})`,
              }))}
            />
          )}

          <Input
            label="Full Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sarah Jenkins"
            required
          />

          <Input
            label="Email Address *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@restaurant.com"
            required
          />

          <Select
            label="Role Permission Level *"
            value={role}
            onChange={(e) => setRole(e.target.value as 'OWNER' | 'MANAGER' | 'STAFF')}
            options={[
              { value: 'OWNER', label: 'OWNER — Full Restaurant Control & Settings' },
              { value: 'MANAGER', label: 'MANAGER — Operational, Bookings & Menu Management' },
              { value: 'STAFF', label: 'STAFF — Floor Map & Seating Operations' },
            ]}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 tracking-wide uppercase">
                Temporary Password
              </label>
              <button
                type="button"
                onClick={() => setTemporaryPassword(generateRandomPassword(12))}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
              >
                Regenerate
              </button>
            </div>
            <Input
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} leftIcon={<UserPlus className="w-4 h-4" />}>
              Provision User
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
