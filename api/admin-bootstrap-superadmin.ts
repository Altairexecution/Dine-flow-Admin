import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK singleton if server credentials are provided
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'dine-flow-v1';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && rawPrivateKey) {
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

const AUTHORIZED_SUPER_ADMIN_UID = 'RnURWhgg29XISmmiyLNj0pQfk0x1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { targetUid, secret } = req.body || {};
    const uidToBootstrap = targetUid || AUTHORIZED_SUPER_ADMIN_UID;

    // Security verification:
    // 1. Check if caller has valid Bearer token for the authorized super admin UID
    // OR 2. Check if ADMIN_BOOTSTRAP_SECRET header/body matches process.env.ADMIN_BOOTSTRAP_SECRET
    const authHeader = req.headers.authorization;
    let isAuthorized = false;

    if (process.env.ADMIN_BOOTSTRAP_SECRET && (secret === process.env.ADMIN_BOOTSTRAP_SECRET || req.headers['x-bootstrap-secret'] === process.env.ADMIN_BOOTSTRAP_SECRET)) {
      isAuthorized = true;
    } else if (authHeader && authHeader.startsWith('Bearer ') && admin.apps.length) {
      const idToken = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      if (decoded.uid === uidToBootstrap || decoded.uid === AUTHORIZED_SUPER_ADMIN_UID) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({
        message: 'Unauthorized: Valid Super Admin credentials or bootstrap secret required.',
      });
    }

    if (!admin.apps.length) {
      return res.status(500).json({
        message: 'Firebase Admin SDK not initialized on server. Check FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.',
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
      message: `Super Admin custom claims and Firestore profile successfully bootstrapped for UID: ${uidToBootstrap}`,
    });
  } catch (error: any) {
    console.error('[Admin Bootstrap Error]', error);
    return res.status(500).json({
      message: error.message || 'Internal Server Error during Super Admin bootstrap',
    });
  }
}
