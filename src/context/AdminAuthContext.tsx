import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { adminDb } from '../lib/dbAdapter';
import { UserProfile } from '../types/auth';

interface AdminAuthContextValue {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const firebaseAuth = auth;
    if (isFirebaseConfigured && firebaseAuth) {
      const unsub = onAuthStateChanged(firebaseAuth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          try {
            const profile = await adminDb.getDoc<UserProfile>('users', fbUser.uid);
            if (profile && profile.role === 'SUPER_ADMIN') {
              setUser(profile);
            } else {
              // Not a super admin - reject access to admin portal
              console.warn('[Admin Security] Non-admin user attempted to access Admin Portal:', fbUser.email);
              await signOut(firebaseAuth);
              setUser(null);
            }
          } catch (err) {
            console.error('[Admin Auth] Error fetching profile:', err);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });
      return () => unsub();
    } else {
      // Local development fallback
      const saved = localStorage.getItem('dineflow_admin_user');
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();

    if (isFirebaseConfigured && auth) {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const profile = await adminDb.getDoc<UserProfile>('users', res.user.uid);

      if (!profile || profile.role !== 'SUPER_ADMIN') {
        await signOut(auth);
        throw new Error('Access Denied: Your account does not have Super Admin permissions.');
      }

      setUser(profile);
      return profile;
    }

    // Local / direct setup fallback for initial setup
    if (cleanEmail === 'admin@dineflow.io' || cleanEmail.includes('admin@')) {
      const localAdmin: UserProfile = {
        id: 'usr_super_admin_1',
        email: cleanEmail,
        name: 'Platform Operator',
        role: 'SUPER_ADMIN',
        restaurantId: 'platform',
        createdAt: new Date().toISOString(),
      };
      setUser(localAdmin);
      localStorage.setItem('dineflow_admin_user', JSON.stringify(localAdmin));
      return localAdmin;
    }

    throw new Error('Invalid Super Admin credentials.');
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    setUser(null);
    localStorage.removeItem('dineflow_admin_user');
  };

  return (
    <AdminAuthContext.Provider value={{ user, firebaseUser, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
