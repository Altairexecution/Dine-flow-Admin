import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Restaurant } from '../../types/restaurant';
import { adminDb } from '../../lib/dbAdapter';
import { useToast } from '../../context/ToastContext';

export interface EditRestaurantModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const EditRestaurantModal: React.FC<EditRestaurantModalProps> = ({
  restaurant,
  isOpen,
  onClose,
  onSaved,
}) => {
  const toast = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || '');
      setPhone(restaurant.phone || '');
      setEmail(restaurant.email || '');
      setAddress(restaurant.address || '');
      setCity(restaurant.city || '');
      setStatus(restaurant.status || 'active');
    }
  }, [restaurant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    setIsLoading(true);
    try {
      await adminDb.updateDoc<Restaurant>('restaurants', restaurant.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        status,
      });

      toast.success('Tenant Updated', `Changes to "${name}" have been saved to Firestore.`);
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast.error('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!restaurant) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Tenant: ${restaurant.name}`}
      description="Update core restaurant metadata and operational status."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Restaurant Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <Select
          label="Tenant Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')}
          options={[
            { value: 'active', label: 'Active — Operational in DineFlow' },
            { value: 'suspended', label: 'Suspended — Access Blocked' },
          ]}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
