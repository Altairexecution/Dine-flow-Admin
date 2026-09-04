import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  WhereFilterOp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

export interface QueryFilter {
  field: string;
  op: WhereFilterOp | '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in';
  value: unknown;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
}

class AdminDatabaseAdapter {
  async getDoc<T>(collectionName: string, id: string): Promise<T | null> {
    if (!isFirebaseConfigured || !db) return null;
    try {
      const docRef = doc(db, collectionName, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as T;
      }
      return null;
    } catch (err) {
      console.error(`[Admin DB] Error reading doc ${collectionName}/${id}:`, err);
      return null;
    }
  }

  async queryDocs<T>(collectionName: string, options: QueryOptions = {}): Promise<T[]> {
    if (!isFirebaseConfigured || !db) return [];
    try {
      const colRef = collection(db, collectionName);
      const constraints: unknown[] = [];

      if (options.filters) {
        options.filters.forEach((f) => {
          constraints.push(where(f.field, f.op as WhereFilterOp, f.value));
        });
      }

      if (options.orderByField) {
        constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
      }

      if (options.limitCount) {
        constraints.push(limit(options.limitCount));
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = query(colRef, ...(constraints as any));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T));
    } catch (err) {
      console.error(`[Admin DB] Error querying ${collectionName}:`, err);
      return [];
    }
  }

  async setDoc<T extends { id: string }>(collectionName: string, id: string, data: T): Promise<void> {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured in Admin Portal');
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
  }

  async updateDoc<T>(collectionName: string, id: string, updates: Partial<T>): Promise<void> {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured in Admin Portal');
    const docRef = doc(db, collectionName, id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() } as any);
  }

  async deleteDoc(collectionName: string, id: string): Promise<void> {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured in Admin Portal');
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }
}

export const adminDb = new AdminDatabaseAdapter();
