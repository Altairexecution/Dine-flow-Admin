import { Restaurant } from './restaurant';
import { UserProfile } from './auth';

export interface PlatformOverview {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalBookings: number;
  totalCustomers: number;
  totalAutomations: number;
  systemHealth: {
    firebaseAuth: 'connected' | 'error';
    firestore: 'connected' | 'error';
    n8nWebhook: 'online' | 'degraded';
  };
}

export interface ProvisionUserRequest {
  restaurantId: string;
  restaurantName: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  temporaryPassword?: string;
  sendInviteEmail?: boolean;
}

export interface ProvisionUserResponse {
  success: boolean;
  uid: string;
  email: string;
  name: string;
  role: string;
  restaurantId: string;
  temporaryPassword?: string;
  message: string;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  cuisineTypes: string[];
  logo?: string;
  coverImage?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword?: string;
}

export interface CreateTenantResponse {
  success: boolean;
  restaurant: Restaurant;
  owner: UserProfile;
  temporaryPassword?: string;
  message: string;
}
