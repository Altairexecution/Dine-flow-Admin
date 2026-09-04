import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });
dotenv.config({ path: join(__dirname, '../.env') });

const TARGET_SUPER_ADMIN_UID = process.env.SUPER_ADMIN_UID || 'RnURWhgg29XISmmiyLNj0pQfk0x1';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'dine-flow-v1';

async function bootstrap() {
  console.log('--- DineFlow Super Admin Bootstrapper ---');
  console.log(`Target Super Admin UID: ${TARGET_SUPER_ADMIN_UID}`);
  console.log(`Firebase Project: ${PROJECT_ID}`);

  let credential;
  const serviceAccountPath = join(__dirname, '../serviceAccountKey.json');

  if (existsSync(serviceAccountPath)) {
    console.log('Loading credentials from serviceAccountKey.json...');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
  } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('Loading credentials from environment variables...');
    credential = admin.credential.cert({
      projectId: PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else {
    console.log('Attempting to use Google Application Default Credentials...');
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({
    credential,
    projectId: PROJECT_ID,
  });

  const auth = admin.auth();
  const db = admin.firestore();

  try {
    // 1. Fetch user by UID
    console.log(`Checking Firebase Auth for UID: ${TARGET_SUPER_ADMIN_UID}...`);
    const user = await auth.getUser(TARGET_SUPER_ADMIN_UID);
    console.log(`Found Auth User: ${user.email} (${user.uid})`);

    // 2. Set custom claims
    console.log('Setting custom claims { role: "SUPER_ADMIN" }...');
    await auth.setCustomUserClaims(TARGET_SUPER_ADMIN_UID, {
      role: 'SUPER_ADMIN',
    });

    // 3. Write /users doc in Firestore
    console.log(`Writing Firestore user profile at /users/${TARGET_SUPER_ADMIN_UID}...`);
    const profile = {
      id: TARGET_SUPER_ADMIN_UID,
      email: user.email || 'admin@dineflow.io',
      name: user.displayName || 'Platform Super Admin',
      role: 'SUPER_ADMIN',
      restaurantId: 'platform',
      restaurantName: 'Spark Scale Platform',
      status: 'active',
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(TARGET_SUPER_ADMIN_UID).set(profile, { merge: true });

    console.log('✅ Super Admin Bootstrap Successful!');
    console.log('Profile Document:', JSON.stringify(profile, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ Bootstrap failed:', err);
    process.exit(1);
  }
}

bootstrap();
