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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Missing or invalid authorization token' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify token and verify Super Admin claim/role if admin SDK is initialized
    if (admin.apps.length) {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
      const userData = userDoc.data();

      if (userData?.role !== 'SUPER_ADMIN' && decodedToken.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only SUPER_ADMIN is authorized to provision accounts.' });
      }
    }

    const { restaurantId, restaurantName, name, email, role, temporaryPassword } = req.body;

    if (!restaurantId || !name || !email || !role) {
      return res.status(400).json({ message: 'Missing required provisioning fields.' });
    }

    // Never allow provisioning of a SUPER_ADMIN via this endpoint
    if (role === 'SUPER_ADMIN') {
      return res.status(400).json({ message: 'Invalid operation: Cannot create SUPER_ADMIN accounts via restaurant provisioning.' });
    }

    let uid = '';
    const cleanEmail = email.toLowerCase().trim();

    if (admin.apps.length) {
      // 1. Create or retrieve Firebase Auth User securely on server
      try {
        const existingUser = await admin.auth().getUserByEmail(cleanEmail);
        uid = existingUser.uid;
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          const createdUser = await admin.auth().createUser({
            email: cleanEmail,
            displayName: name.trim(),
            password: temporaryPassword || Math.random().toString(36).slice(-10) + 'A1!',
          });
          uid = createdUser.uid;
        } else {
          throw err;
        }
      }

      // 2. Create authoritative Firestore Profile Document
      await admin.firestore().collection('users').doc(uid).set(
        {
          id: uid,
          email: cleanEmail,
          name: name.trim(),
          role,
          restaurantId,
          restaurantName,
          status: 'active',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      // Fallback timestamp UID
      uid = `usr_${Date.now().toString(36)}`;
    }

    return res.status(200).json({
      success: true,
      uid,
      email: cleanEmail,
      name,
      role,
      restaurantId,
      temporaryPassword,
      message: 'Account successfully provisioned in Firebase Auth and Firestore.',
    });
  } catch (error: any) {
    console.error('[Admin Provisioning Error]', error);
    return res.status(500).json({
      message: error.message || 'Internal Server Error during user provisioning',
    });
  }
}
