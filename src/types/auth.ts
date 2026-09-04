export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF';

export interface UserProfile {
  id: string; // Firebase Auth UID
  email: string;
  name: string;
  role: UserRole;
  restaurantId: string;
  restaurantName?: string;
  phone?: string;
  avatarUrl?: string;
  status?: 'active' | 'suspended';
  createdAt: string;
}

export interface AdminSession {
  user: UserProfile | null;
  idToken: string | null;
  isLoading: boolean;
}
