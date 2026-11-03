import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

function initFirebaseAdmin(): boolean {
  if (admin.apps.length > 0) return true;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'dine-flow-v1';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!clientEmail || !rawPrivateKey) return false;

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
    return true;
  } catch (err) {
    console.error('[Firebase Admin Init Error]', err);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const isInitialized = initFirebaseAdmin();
  if (!isInitialized) {
    return res.status(500).json({ message: 'Server Firebase Admin SDK not initialized. Please verify Vercel environment variables.' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Missing or invalid authorization token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Verify Super Admin permission
    const callerDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const callerData = callerDoc.data();
    if (callerData?.role !== 'SUPER_ADMIN' && decodedToken.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Only SUPER_ADMIN is authorized to reset passwords.' });
    }

    const { uid, email, newPassword, name, role, restaurantId } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    let targetUid = uid;
    const cleanEmail = email ? email.toLowerCase().trim() : '';

    let authUser: admin.auth.UserRecord | null = null;

    // 1. Try finding by UID
    if (targetUid) {
      try {
        authUser = await admin.auth().getUser(targetUid);
      } catch (err: any) {
        if (err.code !== 'auth/user-not-found') throw err;
      }
    }

    // 2. Try finding by Email if not found by UID
    if (!authUser && cleanEmail) {
      try {
        authUser = await admin.auth().getUserByEmail(cleanEmail);
        targetUid = authUser.uid;
      } catch (err: any) {
        if (err.code !== 'auth/user-not-found') throw err;
      }
    }

    // 3. Update existing or create new Auth user
    if (authUser) {
      await admin.auth().updateUser(authUser.uid, {
        password: newPassword,
      });
      targetUid = authUser.uid;
    } else {
      if (!cleanEmail) {
        return res.status(400).json({ message: 'Cannot provision Firebase Auth user without a valid email address.' });
      }

      const created = await admin.auth().createUser({
        email: cleanEmail,
        password: newPassword,
        displayName: name || cleanEmail.split('@')[0],
      });
      targetUid = created.uid;
    }

    // 4. Update / create Firestore document matching targetUid
    if (targetUid) {
      const userDocRef = admin.firestore().collection('users').doc(targetUid);
      const userDocSnap = await userDocRef.get();

      if (userDocSnap.exists) {
        await userDocRef.update({
          email: cleanEmail || userDocSnap.data()?.email,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await userDocRef.set({
          id: targetUid,
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
          role: role || 'OWNER',
          restaurantId: restaurantId || '',
          status: 'active',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      // If the old UID in Firestore was a temporary mock ID, remove the orphan document
      if (uid && uid !== targetUid) {
        await admin.firestore().collection('users').doc(uid).delete().catch(() => {});
      }
    }

    return res.status(200).json({
      success: true,
      uid: targetUid,
      email: cleanEmail || authUser?.email,
      temporaryPassword: newPassword,
      message: 'Password successfully updated in Firebase Auth.',
    });
  } catch (error: any) {
    console.error('[Admin Reset Password Error]', error);
    return res.status(500).json({
      message: error.message || 'Internal Server Error during password reset',
    });
  }
}
