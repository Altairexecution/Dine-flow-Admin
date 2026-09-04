import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { adminApiClient } from '../../lib/adminApiClient';
import { useToast } from '../../context/ToastContext';
import { generateRandomPassword } from '../../lib/utils';
import { Store, User, Lock, Copy, Check, Sparkles } from 'lucide-react';

export interface CreateRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateRestaurantModal: React.FC<CreateRestaurantModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const toast = useToast();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [cuisineInput, setCuisineInput] = useState('');

  // Initial Owner Details
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState(generateRandomPassword(12));

  const [isLoading, setIsLoading] = useState(false);
  const [provisionedCreds, setProvisionedCreds] = useState<{ email: string; pass: string; slug: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(autoSlug);
  };

  const handleGeneratePassword = () => {
    setOwnerPassword(generateRandomPassword(12));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !ownerEmail.trim() || !ownerName.trim()) {
      toast.error('Missing fields', 'Please fill out all required restaurant and owner fields.');
      return;
    }

    setIsLoading(true);
    try {
      const cuisineTypes = cuisineInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await adminApiClient.createRestaurantWithAdmin({
        name: name.trim(),
        slug: slug.trim(),
        phone: phone.trim() || '+1 (555) 000-0000',
        email: email.trim() || ownerEmail.trim(),
        address: address.trim() || '100 Main Street',
        city: city.trim() || 'Austin, TX',
        cuisineTypes: cuisineTypes.length > 0 ? cuisineTypes : ['Contemporary Dining'],
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerPassword,
      });

      toast.success('Tenant Registered', `Created restaurant "${name}" and provisioned Owner account.`);
      setProvisionedCreds({
        email: ownerEmail.trim(),
        pass: ownerPassword,
        slug: slug.trim(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register tenant';
      toast.error('Registration Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!provisionedCreds) return;
    const text = `DineFlow Restaurant Credentials:\nPortal: https://dineflowv1.vercel.app/login\nEmail: ${provisionedCreds.email}\nTemporary Password: ${provisionedCreds.pass}\nPublic Guest Link: https://dineflowv1.vercel.app/r/${provisionedCreds.slug}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    toast.info('Copied', 'Credentials copied to clipboard. Deliver securely to restaurant owner.');
  };

  const handleDone = () => {
    setProvisionedCreds(null);
    setName('');
    setSlug('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setCuisineInput('');
    setOwnerName('');
    setOwnerEmail('');
    setOwnerPassword(generateRandomPassword(12));
    onCreated();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={provisionedCreds ? handleDone : onClose}
      title={provisionedCreds ? 'Tenant Provisioned Successfully' : 'Register New Restaurant Tenant'}
      description={
        provisionedCreds
          ? 'Deliver these initial login credentials securely to the restaurant owner.'
          : 'Provision a new isolated restaurant tenant and initial Owner account.'
      }
      maxWidth="xl"
    >
      {provisionedCreds ? (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#09101F] border border-purple-500/30 space-y-4">
            <div className="flex items-center gap-2 text-purple-300">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h4 className="text-sm font-bold">Initial Owner Credentials</h4>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Login URL:</span>
                <span className="text-purple-300 font-bold">https://dineflowv1.vercel.app/login</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Owner Email:</span>
                <span className="text-white font-bold">{provisionedCreds.email}</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Temporary Password:</span>
                <span className="text-emerald-400 font-bold">{provisionedCreds.pass}</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Public Page:</span>
                <span className="text-blue-300">/r/{provisionedCreds.slug}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              ⚠️ Note: This temporary password is only displayed once now. Instruct the owner to change it upon first login.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={handleCopyCredentials}
              leftIcon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
            </Button>
            <Button onClick={handleDone}>
              Done & View Fleet
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Restaurant Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider pb-1 border-b border-slate-800">
              <Store className="w-4 h-4 text-purple-400" />
              <span>Restaurant Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Restaurant Name *"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Bella Vista Trattoria"
                required
              />
              <Input
                label="Public Slug *"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="bella-vista"
                helperText="URL: /r/bella-vista"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Business Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (512) 555-0199"
              />
              <Input
                label="Business Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@bellavista.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="204 Congress Ave"
              />
              <Input
                label="City, State"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Austin, TX"
              />
            </div>

            <Input
              label="Cuisine Categories (comma separated)"
              value={cuisineInput}
              onChange={(e) => setCuisineInput(e.target.value)}
              placeholder="Italian, Handmade Pasta, Wood-Fired Pizza"
            />
          </div>

          {/* Section 2: Initial Owner User */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider pb-1 border-b border-slate-800">
              <User className="w-4 h-4 text-purple-400" />
              <span>Initial Owner Account</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Owner Full Name *"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Marco Rossi"
                required
              />
              <Input
                label="Owner Email Address *"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="marco@bellavista.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 tracking-wide uppercase">
                  Generated Temporary Password
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                >
                  Regenerate
                </button>
              </div>
              <div className="relative flex items-center">
                <Input
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Register Tenant
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
