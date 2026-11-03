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

const AUTHORIZED_SUPER_ADMIN_UID = 'RnURWhgg29XISmmiyLNj0pQfk0x1';

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
            let profile = await adminDb.getDoc<UserProfile>('users', fbUser.uid);

            // Auto-bootstrap designated platform super admin UID if needed
            if ((!profile || profile.role !== 'SUPER_ADMIN') && fbUser.uid === AUTHORIZED_SUPER_ADMIN_UID) {
              try {
                const idToken = await fbUser.getIdToken();
                let bootstrapRes = await fetch('/api/admin-bootstrap-superadmin', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                  },
                  body: JSON.stringify({ targetUid: fbUser.uid }),
                });

                if (!bootstrapRes.ok) {
                  // Fallback to GET self-bootstrap check
                  bootstrapRes = await fetch('/api/admin-bootstrap-superadmin');
                }

                if (bootstrapRes.ok) {
                  const data = await bootstrapRes.json();
                  await fbUser.getIdToken(true);
                  if (data.user) {
                    profile = data.user;
                  } else {
                    profile = await adminDb.getDoc<UserProfile>('users', fbUser.uid);
                  }
                }
              } catch (bootstrapErr) {
                console.warn('[Admin Bootstrap] Automatic bootstrap attempt failed:', bootstrapErr);
              }
            }

            const tokenResult = await fbUser.getIdTokenResult();
            const isSuperAdminUser =
              tokenResult.claims.role === 'SUPER_ADMIN' ||
              fbUser.uid === AUTHORIZED_SUPER_ADMIN_UID ||
              profile?.role === 'SUPER_ADMIN';

            if (isSuperAdminUser) {
              if (!profile || profile.role !== 'SUPER_ADMIN') {
                profile = {
                  id: fbUser.uid,
                  email: fbUser.email || 'admin@dineflow.io',
                  name: fbUser.displayName || 'Platform Super Admin',
                  role: 'SUPER_ADMIN',
                  restaurantId: 'platform',
                  status: 'active',
                  createdAt: new Date().toISOString(),
                };
                adminDb.setDoc('users', fbUser.uid, profile).catch(() => {});
              }
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
      let profile = await adminDb.getDoc<UserProfile>('users', res.user.uid);

      if ((!profile || profile.role !== 'SUPER_ADMIN') && res.user.uid === AUTHORIZED_SUPER_ADMIN_UID) {
        try {
          const idToken = await res.user.getIdToken();
          let bootstrapRes = await fetch('/api/admin-bootstrap-superadmin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ targetUid: res.user.uid }),
          });

          if (!bootstrapRes.ok) {
            bootstrapRes = await fetch('/api/admin-bootstrap-superadmin');
          }

          if (bootstrapRes.ok) {
            const data = await bootstrapRes.json();
            await res.user.getIdToken(true);
            if (data.user) {
              profile = data.user;
            } else {
              profile = await adminDb.getDoc<UserProfile>('users', res.user.uid);
            }
          } else {
            const errData = await bootstrapRes.json().catch(() => ({}));
            console.error('[Admin Bootstrap] Server bootstrap failed:', errData);
          }
        } catch (bootstrapErr) {
          console.warn('[Admin Bootstrap] Bootstrap on login failed:', bootstrapErr);
        }
      }

      const tokenResult = await res.user.getIdTokenResult();
      const isSuperAdminUser =
        tokenResult.claims.role === 'SUPER_ADMIN' ||
        res.user.uid === AUTHORIZED_SUPER_ADMIN_UID ||
        profile?.role === 'SUPER_ADMIN';

      if (isSuperAdminUser) {
        if (!profile || profile.role !== 'SUPER_ADMIN') {
          profile = {
            id: res.user.uid,
            email: res.user.email || cleanEmail,
            name: res.user.displayName || 'Platform Super Admin',
            role: 'SUPER_ADMIN',
            restaurantId: 'platform',
            restaurantName: 'Spark Scale Platform',
            status: 'active',
            createdAt: new Date().toISOString(),
          };
          adminDb.setDoc('users', res.user.uid, profile).catch(() => {});
        }
        setUser(profile);
        return profile;
      }

      await signOut(auth);
      throw new Error('Access Denied: Your account does not have Super Admin permissions.');
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
