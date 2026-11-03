import { auth, isFirebaseConfigured } from './firebase';
import {
  ProvisionUserRequest,
  ProvisionUserResponse,
  CreateTenantRequest,
  CreateTenantResponse,
} from '../types/admin';
import { adminDb } from './dbAdapter';
import { generateId } from './utils';
import { Restaurant } from '../types/restaurant';
import { UserProfile } from '../types/auth';

export interface ResetPasswordRequest {
  uid?: string;
  email: string;
  newPassword: string;
  name?: string;
  role?: string;
  restaurantId?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  uid: string;
  email: string;
  temporaryPassword: string;
  message: string;
}

class AdminApiClient {
  private async getAuthHeader(): Promise<HeadersInit> {
    const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async provisionUser(req: ProvisionUserRequest): Promise<ProvisionUserResponse> {
    try {
      const headers = await this.getAuthHeader();
      const res = await fetch('/api/admin-provision-user', {
        method: 'POST',
        headers,
        body: JSON.stringify(req),
      });

      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Provisioning failed with HTTP ${res.status}`);
    } catch (apiError) {
      if (isFirebaseConfigured) {
        throw apiError;
      }
      console.warn('[Admin API] Serverless endpoint unavailable or local mode, provisioning directly into Firestore authorization layer:', apiError);

      // Direct Firestore Provisioning for local testing / direct DB mode
      const uid = generateId('usr');
      const userProfile: UserProfile = {
        id: uid,
        email: req.email.toLowerCase().trim(),
        name: req.name.trim(),
        role: req.role,
        restaurantId: req.restaurantId,
        restaurantName: req.restaurantName,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await adminDb.setDoc('users', uid, userProfile);

      return {
        success: true,
        uid,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        restaurantId: userProfile.restaurantId,
        temporaryPassword: req.temporaryPassword,
        message: 'User authorization record successfully provisioned in Firestore.',
      };
    }
  }

  async createRestaurantWithAdmin(req: CreateTenantRequest): Promise<CreateTenantResponse> {
    try {
      const headers = await this.getAuthHeader();
      const res = await fetch('/api/admin-create-restaurant', {
        method: 'POST',
        headers,
        body: JSON.stringify(req),
      });

      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Tenant creation failed with HTTP ${res.status}`);
    } catch (apiError) {
      if (isFirebaseConfigured) {
        throw apiError;
      }
      console.warn('[Admin API] Serverless endpoint unavailable, executing Firestore tenant creation:', apiError);

      const restaurantId = `rest_${req.slug.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
      const ownerId = generateId('usr');

      const restaurant: Restaurant = {
        id: restaurantId,
        name: req.name.trim(),
        slug: req.slug.trim().toLowerCase(),
        phone: req.phone.trim(),
        email: req.email.trim(),
        address: req.address.trim(),
        city: req.city.trim(),
        cuisineTypes: req.cuisineTypes,
        logo: req.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&h=160&fit=crop&q=80',
        coverImage: req.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&h=800&fit=crop&q=80',
        status: 'active',
        ownerId,
        ownerEmail: req.ownerEmail.toLowerCase().trim(),
        ownerName: req.ownerName.trim(),
        createdAt: new Date().toISOString(),
      };

      const owner: UserProfile = {
        id: ownerId,
        email: req.ownerEmail.toLowerCase().trim(),
        name: req.ownerName.trim(),
        role: 'OWNER',
        restaurantId,
        restaurantName: restaurant.name,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await adminDb.setDoc('restaurants', restaurantId, restaurant);
      await adminDb.setDoc('users', ownerId, owner);

      return {
        success: true,
        restaurant,
        owner,
        temporaryPassword: req.ownerPassword,
        message: 'Restaurant tenant and Owner account provisioned in Firestore.',
      };
    }
  }

  async resetPassword(req: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const headers = await this.getAuthHeader();
    const res = await fetch('/api/admin-reset-password', {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });

    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Password reset failed with HTTP ${res.status}`);
  }
}

export const adminApiClient = new AdminApiClient();
