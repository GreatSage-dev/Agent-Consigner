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
    let isSimFallbackActive = false;
    let unsubSim: (() => void) | null = null;

    const unsubFirebase = onValue(
      requestRef,
      (snapshot) => {
        if (isSimFallbackActive) return;
        if (snapshot.exists()) {
          callback(snapshot.val() as CosignRequest);
        } else {
          // If it doesn't exist in Firebase yet, seed it from the simulator's initial state
          const unsubscribeSim = simulator.subscribe(requestId, (data) => {
            set(requestRef, data).catch((err) => {
              console.warn('Firebase set failed, using local simulation state:', err);
            });
            callback(data);
            unsubscribeSim();
          });
        }
      },
      (error) => {
        console.warn('Firebase subscribe failed, falling back to local simulator:', error);
        isSimFallbackActive = true;
        unsubSim = simulator.subscribe(requestId, callback);
      }
    );

    return () => {
      unsubFirebase();
      if (unsubSim) unsubSim();
    };
  } else {
    return simulator.subscribe(requestId, callback);
  }
}

export function updateCosignRequest(
  requestId: string,
  updates: Partial<CosignRequest>
): Promise<void> {
  // Always keep the local simulator state in sync
  simulator.update(requestId, updates);

  if (db) {
    const requestRef = ref(db, `cosignRequests/${requestId}`);
    return new Promise((resolve) => {
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
            .catch((err) => {
              console.warn('Firebase set update failed:', err);
              resolve(); // Resolve anyway to let frontend run locally
            });
        },
        (error) => {
          console.warn('Firebase update onValue failed:', error);
          resolve(); // Resolve anyway to let frontend run locally
        },
        { onlyOnce: true }
      );
    });
  } else {
    return Promise.resolve();
  }
}
