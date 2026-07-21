/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAuKhX19yYpH5MrL7KTzXiS44AgEaRifw8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hassan-6f8e3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hassan-6f8e3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hassan-6f8e3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "81853320851",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:81853320851:web:64b0346f8d48bea09a4766",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-2HXL3Z8L8W"
};

// With these defaults, we now have valid active credentials ready to run
const hasCredentials = true;
const missingCredentials: string[] = [];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(
  app, 
  import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)"
);
const storage = getStorage(app);

export { app, auth, db, storage, hasCredentials, missingCredentials };
