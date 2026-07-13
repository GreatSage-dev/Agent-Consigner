import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { CosignRequest } from '../types';
import { simulator } from './simulator';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.databaseURL;

let db: any = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log('Firebase Database connected successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase, falling back to simulator:', error);
  }
} else {
  console.log('Firebase environment variables not set. Using local simulation database.');
}

export function subscribeToCosignRequest(
  requestId: string,
  callback: (data: CosignRequest) => void
): () => void {
  if (db) {
    const requestRef = ref(db, `cosignRequests/${requestId}`);
    return onValue(requestRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as CosignRequest);
      } else {
        // If it doesn't exist in Firebase yet, seed it from the simulator's initial state
        const unsubscribeSim = simulator.subscribe(requestId, (data) => {
          set(requestRef, data);
          callback(data);
          // Unsubscribe from simulator once we seed Firebase
          unsubscribeSim();
        });
      }
    });
  } else {
    return simulator.subscribe(requestId, callback);
  }
}

export function updateCosignRequest(
  requestId: string,
  updates: Partial<CosignRequest>
): Promise<void> {
  if (db) {
    const requestRef = ref(db, `cosignRequests/${requestId}`);
    // In real Firebase, we do a set of the combined state (or update specific fields if needed)
    return new Promise((resolve, reject) => {
      // First get current val to merge
      onValue(
        requestRef,
        (snapshot) => {
          const current = snapshot.val() || {};
          const merged = {
            ...current,
            ...updates,
            updatedAt: Date.now(),
          };
          set(requestRef, merged)
            .then(() => resolve())
            .catch(reject);
        },
        { onlyOnce: true }
      );
    });
  } else {
    simulator.update(requestId, updates);
    return Promise.resolve();
  }
}
