/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDT6Mf8LxbTi17tqNP172UczCKvGwyfSK0",
  authDomain: "nifty-timer-1xqhd.firebaseapp.com",
  projectId: "nifty-timer-1xqhd",
  storageBucket: "nifty-timer-1xqhd.firebasestorage.app",
  messagingSenderId: "246599631732",
  appId: "1:246599631732:web:acbe6449c2350f58e1a221"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-c942fdfb-38e7-422a-957e-df3eab02e1ba");

export { app, auth, db };
