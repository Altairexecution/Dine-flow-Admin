import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const rawAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const rawStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const rawSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const rawAppId = import.meta.env.VITE_FIREBASE_APP_ID;

const clean = (val?: string) => (val ? val.trim().replace(/^['"]|['"]$/g, '') : undefined);

const apiKey = clean(rawApiKey);
const projectId = clean(rawProjectId) || 'dine-flow-v1';
const authDomain = clean(rawAuthDomain) || `${projectId}.firebaseapp.com`;
const storageBucket = clean(rawStorageBucket) || `${projectId}.firebasestorage.app`;
const messagingSenderId = clean(rawSenderId);
const appId = clean(rawAppId);

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

export const isFirebaseConfigured: boolean = Boolean(
  apiKey &&
  projectId &&
  apiKey !== 'your_api_key' &&
  apiKey.length > 10
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.info(`[DineFlow Admin] Connected to Firebase Project: ${projectId}`);
  } catch (error) {
    console.error('[DineFlow Admin] Firebase client initialization error:', error);
  }
} else {
  console.warn('[DineFlow Admin] Firebase client environment variables not yet configured.');
}

export { app, auth, db, storage };
