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

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Missing or invalid authorization token' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (isInitialized) {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
      const userData = userDoc.data();

      if (userData?.role !== 'SUPER_ADMIN' && decodedToken.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only SUPER_ADMIN is authorized to register tenants.' });
      }
    }

    const {
      name,
      slug,
      phone,
      email,
      address,
      city,
      cuisineTypes,
      logo,
      coverImage,
      ownerName,
      ownerEmail,
      ownerPassword,
    } = req.body;

    if (!name || !slug || !ownerName || !ownerEmail) {
      return res.status(400).json({ message: 'Missing required tenant fields.' });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const restaurantId = `rest_${cleanSlug.replace(/-/g, '_')}`;
    const cleanOwnerEmail = ownerEmail.trim().toLowerCase();

    let ownerUid = '';

    if (!isInitialized) {
      return res.status(500).json({
        message: 'Firebase Admin SDK is not initialized on the server. Please check server environment variables.',
      });
    }

    // 1. Create or lookup Owner in Firebase Auth
      try {
        const existing = await admin.auth().getUserByEmail(cleanOwnerEmail);
        ownerUid = existing.uid;
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          const created = await admin.auth().createUser({
            email: cleanOwnerEmail,
            displayName: ownerName.trim(),
            password: ownerPassword || Math.random().toString(36).slice(-10) + 'A1!',
          });
          ownerUid = created.uid;
        } else {
          throw err;
        }
      }

      // 2. Write Restaurant Document
      const restaurantRecord = {
        id: restaurantId,
        name: name.trim(),
        slug: cleanSlug,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        cuisineTypes: cuisineTypes || [],
        logo: logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&h=160&fit=crop&q=80',
        coverImage: coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&h=800&fit=crop&q=80',
        status: 'active',
        ownerId: ownerUid,
        ownerEmail: cleanOwnerEmail,
        ownerName: ownerName.trim(),
        createdAt: new Date().toISOString(),
      };

      await admin.firestore().collection('restaurants').doc(restaurantId).set(restaurantRecord, { merge: true });

      // 3. Write Owner Profile Document
      const ownerRecord = {
        id: ownerUid,
        email: cleanOwnerEmail,
        name: ownerName.trim(),
        role: 'OWNER',
        restaurantId,
        restaurantName: name.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await admin.firestore().collection('users').doc(ownerUid).set(ownerRecord, { merge: true });

      return res.status(200).json({
        success: true,
        restaurant: restaurantRecord,
        owner: ownerRecord,
        temporaryPassword: ownerPassword,
        message: 'Restaurant tenant and Owner account provisioned in Firebase.',
      });
  } catch (error: any) {
    console.error('[Admin Create Restaurant Error]', error);
    return res.status(500).json({
      message: error.message || 'Internal Server Error during restaurant creation',
    });
  }
}
