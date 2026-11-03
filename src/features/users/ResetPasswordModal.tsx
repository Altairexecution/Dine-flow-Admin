import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import { adminApiClient } from '../../lib/adminApiClient';
import { generateRandomPassword } from '../../lib/utils';
import { UserProfile } from '../../types/auth';
import { KeyRound, Copy, Check, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSuccess?: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provisionedCreds, setProvisionedCreds] = useState<{ email: string; pass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewPassword(generateRandomPassword(12));
      setProvisionedCreds(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!user) return null;

  const handleGenerate = () => {
    setNewPassword(generateRandomPassword(12));
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await adminApiClient.resetPassword({
        uid: user.id,
        email: user.email,
        newPassword,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
      });

      toast.success('Password Updated', `Updated credentials for ${user.email}`);
      setProvisionedCreds({
        email: res.email || user.email,
        pass: res.temporaryPassword || newPassword,
      });
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed';
      toast.error('Reset Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!provisionedCreds) return;
    const text = `DineFlow Restaurant Credentials:\nLogin Portal: https://dineflowv1.vercel.app/login\nEmail: ${provisionedCreds.email}\nPassword: ${provisionedCreds.pass}\n(Note: Sign in using your Email Address, NOT the User ID or Restaurant ID)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    toast.info('Copied', 'Credentials copied to clipboard.');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={provisionedCreds ? 'New Credentials Ready' : `Reset Password for ${user.name}`}
      description={
        provisionedCreds
          ? 'Deliver these updated credentials to the user. They can now log in immediately.'
          : `Set a new password for ${user.email} and sync directly to Firebase Authentication.`
      }
      maxWidth="lg"
    >
      {provisionedCreds ? (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-[#09101F] border border-purple-500/30 space-y-4">
            <div className="flex items-center gap-2 text-purple-300">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h4 className="text-sm font-bold">Updated Login Credentials</h4>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Login URL:</span>
                <span className="text-purple-300 font-bold">https://dineflowv1.vercel.app/login</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Login Email:</span>
                <span className="text-white font-bold">{provisionedCreds.email}</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">New Password:</span>
                <span className="text-emerald-400 font-bold">{provisionedCreds.pass}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Important:</strong> The user MUST enter their <strong>Email Address</strong> ({provisionedCreds.email}) to sign in to DineFlow, NOT the user ID or restaurant ID.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
            </Button>
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Target User:</span>
              <span className="text-white font-bold">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Login Email:</span>
              <span className="text-purple-300 font-mono">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Role:</span>
              <span className="text-slate-200">{user.role}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">New Password</label>
              <button
                type="button"
                onClick={handleGenerate}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Generate Strong</span>
              </button>
            </div>
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 chars)"
              required
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-purple-950/20 border border-purple-800/30 rounded-xl text-purple-300 text-xs">
            <KeyRound className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              This will update Firebase Authentication directly and ensure the user profile is active.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} leftIcon={<KeyRound className="w-4 h-4" />}>
              Update & Sync Password
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
