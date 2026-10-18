/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NAYAB FIT - Firebase Admin Custom Claims Utility
 * 
 * This secure utility script assigns, verifies, or revokes the 'admin' custom claim
 * in Firebase Authentication, as well as provisions the protected Firestore /admins/{uid}
 * registry entry.
 * 
 * Usage:
 *   # Set admin claims for designated default admin emails:
 *   npm run set-admin
 * 
 *   # Set admin claims for a specific email:
 *   npx tsx scripts/set-admin-claims.ts user@example.com
 * 
 *   # Verify admin claims for an email:
 *   npx tsx scripts/set-admin-claims.ts --verify user@example.com
 * 
 *   # Revoke admin claims:
 *   npx tsx scripts/set-admin-claims.ts --revoke user@example.com
 * 
 * Credentials Setup:
 *   1. Download serviceAccountKey.json from Firebase Console:
 *      Project Settings -> Service accounts -> Generate new private key
 *   2. Place as 'serviceAccountKey.json' in project root, or set:
 *      export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
 *      or
 *      export FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
 */

import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load local environment variables
dotenv.config();

// Designated Authorized Administrator Emails
export const AUTHORIZED_ADMIN_EMAILS = [
  'itxmerajkhan3109@gmail.com',
  'merajkhan3109@gmail.com'
];

/**
 * Initializes Firebase Admin SDK with available service account or default credentials.
 */
export function initFirebaseAdmin(): App {
  const currentApps = getApps();
  if (currentApps.length > 0) {
    return currentApps[0];
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'hassan-6f8e3';

  // 1. Check direct JSON string env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      return initializeApp({
        credential: cert(parsed),
        projectId
      });
    } catch {
      console.warn('Warning: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON.');
    }
  }

  // 2. Check local key file candidates
  const keyCandidates = [
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(process.cwd(), 'firebase-service-account.json'),
    path.resolve(process.cwd(), 'service-account.json'),
    process.env.GOOGLE_APPLICATION_CREDENTIALS ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS) : ''
  ].filter(Boolean);

  for (const keyPath of keyCandidates) {
    if (fs.existsSync(keyPath)) {
      try {
        const fileContent = fs.readFileSync(keyPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        return initializeApp({
          credential: cert(parsed),
          projectId
        });
      } catch (err) {
        console.warn(`Warning: Failed to load credentials from ${keyPath}`);
      }
    }
  }

  // 3. Fallback to Google Application Default Credentials or Project ID configuration
  try {
    return initializeApp({
      credential: applicationDefault(),
      projectId
    });
  } catch {
    return initializeApp({
      projectId
    });
  }
}

/**
 * Assigns 'admin: true' custom claim and registers admin in Firestore.
 */
export async function assignAdminClaim(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  console.log(`\n==================================================`);
  console.log(`Granting Firebase Admin Custom Claim to: ${normalizedEmail}`);
  console.log(`==================================================`);

  try {
    const app = initFirebaseAdmin();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    // 1. Look up user by email in Firebase Authentication
    let userRecord: UserRecord;
    try {
      userRecord = await auth.getUserByEmail(normalizedEmail);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.error(`❌ User not found in Firebase Authentication for email: ${normalizedEmail}`);
        console.log(`ℹ️ The user must first register an account on the website before custom claims can be attached.`);
        return false;
      }
      throw err;
    }

    console.log(`✓ Located user account in Firebase Auth:`);
    console.log(`  - UID: ${userRecord.uid}`);
    console.log(`  - Display Name: ${userRecord.displayName || '(None)'}`);
    console.log(`  - Email Verified: ${userRecord.emailVerified}`);

    // 2. Preserve existing custom claims while adding admin: true
    const existingClaims = userRecord.customClaims || {};
    const newClaims = {
      ...existingClaims,
      admin: true
    };

    await auth.setCustomUserClaims(userRecord.uid, newClaims);
    console.log(`✓ Successfully assigned custom claims to Auth token:`);
    console.log(`  Claims:`, JSON.stringify(newClaims, null, 2));

    // 3. Register in protected Firestore /admins/{uid} collection for redundancy
    try {
      await firestore.collection('admins').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: normalizedEmail,
        role: 'admin',
        grantedAt: FieldValue.serverTimestamp(),
        grantedBy: 'cli-custom-claims-utility'
      }, { merge: true });
      console.log(`✓ Synchronized protected admin registry document: /admins/${userRecord.uid}`);
    } catch (dbErr: any) {
      console.warn(`⚠️ Note: Firestore registry write encountered: ${dbErr.message}`);
    }

    // 4. Update role field in /users/{uid} document
    try {
      await firestore.collection('users').doc(userRecord.uid).set({
        role: 'admin',
        updatedAt: Date.now()
      }, { merge: true });
      console.log(`✓ Updated /users/${userRecord.uid} profile role field to 'admin'`);
    } catch (dbErr: any) {
      console.warn(`⚠️ Note: /users profile update encountered: ${dbErr.message}`);
    }

    console.log(`\n🎉 SUCCESS! Admin role is now fully active for: ${normalizedEmail}`);
    console.log(`IMPORTANT: The user must refresh their token to apply claims immediately:`);
    console.log(`  - Sign out and sign back in, OR`);
    console.log(`  - Client triggers: auth.currentUser.getIdTokenResult(true)`);
    return true;

  } catch (err: any) {
    console.error(`❌ Failed to assign admin claims:`, err.message);
    if (err.code === 'app/invalid-credential' || err.message?.includes('credential') || err.message?.includes('Could not load the default credentials')) {
      printCredentialHelp();
    }
    return false;
  }
}

/**
 * Revokes 'admin' custom claim from user.
 */
export async function revokeAdminClaim(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  console.log(`\nRevoking admin custom claim from: ${normalizedEmail}...`);

  try {
    const app = initFirebaseAdmin();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    const userRecord = await auth.getUserByEmail(normalizedEmail);
    const existingClaims = userRecord.customClaims || {};
    const newClaims = { ...existingClaims };
    delete (newClaims as any).admin;

    await auth.setCustomUserClaims(userRecord.uid, newClaims);
    console.log(`✓ Removed 'admin' claim from Auth token for UID: ${userRecord.uid}`);

    // Remove from Firestore /admins/{uid}
    try {
      await firestore.collection('admins').doc(userRecord.uid).delete();
      console.log(`✓ Removed /admins/${userRecord.uid} registry document`);
    } catch (err: any) {
      console.warn(`⚠️ Failed to remove /admins doc: ${err.message}`);
    }

    // Update /users/{uid}
    try {
      await firestore.collection('users').doc(userRecord.uid).set({
        role: 'user',
        updatedAt: Date.now()
      }, { merge: true });
      console.log(`✓ Downgraded /users/${userRecord.uid} role to 'user'`);
    } catch (err: any) {
      console.warn(`⚠️ Failed to update /users doc: ${err.message}`);
    }

    console.log(`🎉 SUCCESS: Admin privileges revoked for ${normalizedEmail}.`);
    return true;
  } catch (err: any) {
    console.error(`❌ Revocation failed:`, err.message);
    return false;
  }
}

/**
 * Inspects and logs current custom claims and admin status for an email.
 */
export async function verifyAdminStatus(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  console.log(`\n==================================================`);
  console.log(`Inspecting Security Credentials for: ${normalizedEmail}`);
  console.log(`==================================================`);

  try {
    const app = initFirebaseAdmin();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    const userRecord = await auth.getUserByEmail(normalizedEmail);
    console.log(`User Profile:`);
    console.log(`  - UID: ${userRecord.uid}`);
    console.log(`  - Email: ${userRecord.email}`);
    console.log(`  - Claims:`, JSON.stringify(userRecord.customClaims || {}, null, 2));

    const hasClaim = userRecord.customClaims?.admin === true;
    console.log(`  - Has admin Custom Claim: ${hasClaim ? '✅ YES' : '❌ NO'}`);

    // Check /admins/{uid} in Firestore
    try {
      const adminSnap = await firestore.collection('admins').doc(userRecord.uid).get();
      console.log(`  - In Firestore /admins registry: ${adminSnap.exists ? '✅ YES' : '❌ NO'}`);
    } catch (err: any) {
      console.log(`  - In Firestore /admins registry: ⚠️ Check skipped (${err.message})`);
    }

    // Check designated email whitelist
    const isDesignated = AUTHORIZED_ADMIN_EMAILS.includes(normalizedEmail);
    console.log(`  - In designated admin email whitelist: ${isDesignated ? '✅ YES' : '❌ NO'}`);

    const isFullyAuthorized = hasClaim || isDesignated;
    console.log(`\nOverall Authorization Status: ${isFullyAuthorized ? '🟢 AUTHORIZED ADMINISTRATOR' : '🔴 STANDARD CUSTOMER'}`);

  } catch (err: any) {
    console.error(`❌ Inspection failed:`, err.message);
    if (err.message?.includes('credential')) {
      printCredentialHelp();
    }
  }
}

function printCredentialHelp() {
  console.log(`
-----------------------------------------------------------------------------
ℹ️ HOW TO CONFIGURE FIREBASE SERVICE ACCOUNT CREDENTIALS:
-----------------------------------------------------------------------------
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project ("hassan-6f8e3")
3. Navigate to: Project Settings (gear icon) -> "Service accounts" tab
4. Click "Generate new private key" -> Confirm download.
5. Place the downloaded JSON file in this project root as "serviceAccountKey.json".
   OR set an environment variable:
   export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
6. Re-run: npm run set-admin
-----------------------------------------------------------------------------
`);
}

// CLI runner when executed directly
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  npx tsx scripts/set-admin-claims.ts [email]            Assign admin custom claims
  npx tsx scripts/set-admin-claims.ts --verify <email>   Check claims status
  npx tsx scripts/set-admin-claims.ts --revoke <email>   Revoke admin privileges
    `);
    return;
  }

  if (args.includes('--verify')) {
    const emailIndex = args.indexOf('--verify') + 1;
    const targetEmail = args[emailIndex] || AUTHORIZED_ADMIN_EMAILS[0];
    await verifyAdminStatus(targetEmail);
    return;
  }

  if (args.includes('--revoke')) {
    const emailIndex = args.indexOf('--revoke') + 1;
    const targetEmail = args[emailIndex];
    if (!targetEmail) {
      console.error('Please specify an email to revoke: --revoke user@example.com');
      return;
    }
    await revokeAdminClaim(targetEmail);
    return;
  }

  // If a specific email is provided
  const targetEmail = args.find(arg => !arg.startsWith('--'));
  if (targetEmail) {
    await assignAdminClaim(targetEmail);
    return;
  }

  // Default: Process all designated admin emails
  console.log('No specific email provided. Processing designated administrative accounts:');
  console.log(AUTHORIZED_ADMIN_EMAILS.map(e => ` - ${e}`).join('\n'));

  for (const email of AUTHORIZED_ADMIN_EMAILS) {
    await assignAdminClaim(email);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('set-admin-claims.ts')) {
  main().catch(err => {
    console.error('Unexpected CLI error:', err);
    process.exit(1);
  });
}
