/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if credentials are empty to provide a clear fallback warning
const hasCredentials = !!import.meta.env.VITE_FIREBASE_API_KEY;

const app = initializeApp(
  hasCredentials 
    ? firebaseConfig 
    : {
        apiKey: "placeholder",
        authDomain: "placeholder",
        projectId: "placeholder",
        storageBucket: "placeholder",
        messagingSenderId: "placeholder",
        appId: "placeholder"
      }
);

const auth = getAuth(app);
const db = getFirestore(
  app, 
  import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)"
);
const storage = getStorage(app);

export { app, auth, db, storage, hasCredentials };
