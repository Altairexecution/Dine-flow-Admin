import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

function initFirebaseAdmin(): { initialized: boolean; error?: string } {
  if (admin.apps.length > 0) {
    return { initialized: true };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'dine-flow-v1';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!clientEmail || !rawPrivateKey) {
    return {
      initialized: false,
      error: `Missing credentials: ${!clientEmail ? 'FIREBASE_CLIENT_EMAIL ' : ''}${!rawPrivateKey ? 'FIREBASE_PRIVATE_KEY' : ''}`.trim(),
    };
  }

  try {
    let privateKey = rawPrivateKey.trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    return { initialized: true };
  } catch (err: any) {
    return { initialized: false, error: err.message };
  }
}

const AUTHORIZED_SUPER_ADMIN_UID = 'RnURWhgg29XISmmiyLNj0pQfk0x1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const initResult = initFirebaseAdmin();

  // GET handler: Diagnostics and status inspection without exposing any secrets
  if (req.method === 'GET') {
    const hasProjectId = Boolean(process.env.FIREBASE_PROJECT_ID);
    const hasClientEmail = Boolean(process.env.FIREBASE_CLIENT_EMAIL);
    const hasPrivateKey = Boolean(process.env.FIREBASE_PRIVATE_KEY);

    let targetUserExists: boolean | null = null;
    let targetUserEmail: string | null = null;
    let customClaims: Record<string, unknown> | null = null;
    let firestoreProfileExists: boolean | null = null;
    let firestoreRole: string | null = null;
    let authError: string | null = null;
    let autoBootstrapped = false;

    if (initResult.initialized) {
      try {
        const userRecord = await admin.auth().getUser(AUTHORIZED_SUPER_ADMIN_UID);
        targetUserExists = true;
        targetUserEmail = userRecord.email || null;
        customClaims = (userRecord.customClaims as Record<string, unknown>) || {};

        const userDoc = await admin.firestore().collection('users').doc(AUTHORIZED_SUPER_ADMIN_UID).get();
        firestoreProfileExists = userDoc.exists;
        if (userDoc.exists) {
          firestoreRole = userDoc.data()?.role || null;
        }

        // If target user exists and custom claim or firestore doc is missing, auto-bootstrap it
        if (customClaims?.role !== 'SUPER_ADMIN' || !userDoc.exists || firestoreRole !== 'SUPER_ADMIN') {
          await admin.auth().setCustomUserClaims(AUTHORIZED_SUPER_ADMIN_UID, { role: 'SUPER_ADMIN' });
          const userProfile = {
            id: AUTHORIZED_SUPER_ADMIN_UID,
            email: userRecord.email?.toLowerCase() || 'admin@dineflow.io',
            name: userRecord.displayName || 'Platform Super Admin',
            role: 'SUPER_ADMIN',
            restaurantId: 'platform',
            restaurantName: 'Spark Scale Platform',
            status: 'active',
            updatedAt: new Date().toISOString(),
          };
          await admin.firestore().collection('users').doc(AUTHORIZED_SUPER_ADMIN_UID).set(userProfile, { merge: true });
          customClaims = { role: 'SUPER_ADMIN' };
          firestoreProfileExists = true;
          firestoreRole = 'SUPER_ADMIN';
          autoBootstrapped = true;
        }
      } catch (err: any) {
        authError = err.message;
        if (err.code === 'auth/user-not-found') {
          targetUserExists = false;
        }
      }
    }

    return res.status(200).json({
      status: 'ok',
      endpoint: '/api/admin-bootstrap-superadmin',
      serverFirebaseAdminInitialized: initResult.initialized,
      initError: initResult.error || null,
      environmentVariablesConfigured: {
        FIREBASE_PROJECT_ID: hasProjectId,
        FIREBASE_CLIENT_EMAIL: hasClientEmail,
        FIREBASE_PRIVATE_KEY: hasPrivateKey,
      },
      targetUid: AUTHORIZED_SUPER_ADMIN_UID,
      targetUserExists,
      targetUserEmail,
      customClaims,
      firestoreProfileExists,
      firestoreRole,
      autoBootstrapped,
      authError,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { targetUid, secret } = req.body || {};
    const uidToBootstrap = targetUid || AUTHORIZED_SUPER_ADMIN_UID;

    const authHeader = req.headers.authorization;
    let isAuthorized = false;

    if (
      process.env.ADMIN_BOOTSTRAP_SECRET &&
      (secret === process.env.ADMIN_BOOTSTRAP_SECRET || req.headers['x-bootstrap-secret'] === process.env.ADMIN_BOOTSTRAP_SECRET)
    ) {
      isAuthorized = true;
    } else if (authHeader && authHeader.startsWith('Bearer ') && initResult.initialized) {
      const idToken = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      if (decoded.uid === uidToBootstrap || decoded.uid === AUTHORIZED_SUPER_ADMIN_UID) {
        isAuthorized = true;
      }
    } else if (uidToBootstrap === AUTHORIZED_SUPER_ADMIN_UID && initResult.initialized) {
      // Allow self-bootstrap of the designated super admin UID
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(401).json({
        message: 'Unauthorized: Valid Super Admin credentials or bootstrap secret required.',
      });
    }

    if (!initResult.initialized) {
      return res.status(500).json({
        message: `Firebase Admin SDK not initialized on server: ${initResult.error || 'Check environment variables'}`,
      });
    }

    // 1. Fetch user from Firebase Auth
    const userRecord = await admin.auth().getUser(uidToBootstrap);

    // 2. Set custom claims { role: 'SUPER_ADMIN' }
    await admin.auth().setCustomUserClaims(uidToBootstrap, {
      role: 'SUPER_ADMIN',
    });

    // 3. Create or update Firestore profile document
    const userProfile = {
      id: uidToBootstrap,
      email: userRecord.email?.toLowerCase() || 'admin@dineflow.io',
      name: userRecord.displayName || 'Platform Super Admin',
      role: 'SUPER_ADMIN',
      restaurantId: 'platform',
      restaurantName: 'Spark Scale Platform',
      status: 'active',
      updatedAt: new Date().toISOString(),
    };

    await admin.firestore().collection('users').doc(uidToBootstrap).set(userProfile, { merge: true });

    return res.status(200).json({
      success: true,
      uid: uidToBootstrap,
      role: 'SUPER_ADMIN',
      email: userRecord.email,
      user: userProfile,
      message: `Super Admin custom claims and Firestore profile successfully bootstrapped for UID: ${uidToBootstrap}`,
    });
  } catch (error: any) {
    console.error('[Admin Bootstrap Error]', error);
    return res.status(500).json({
      message: error.message || 'Internal Server Error during Super Admin bootstrap',
    });
  }
}
