/**
 * server/setupDefaultUsers.js
 * ------------------------------------------------------------------
 * Script to create default test users for LearnTogether.
 * Run with: node server/setupDefaultUsers.js
 * 
 * Creates the following users:
 *   - Yash-777 (admin role) - password is randomly generated
 *   - Yash-Admin (admin role) - password: Admin
 *   - Yash-Editor (editor role) - password: Editor
 *   - Yash-Viewer (viewer role) - password: Viewer
 * 
 * Passwords will be displayed at the end - save them securely!
 * Once live, these should be replaced with proper secrets management.
 */

import admin from 'firebase-admin';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Color codes for console output (defined early for error messages)
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Helper function to load service account key
function loadServiceAccountKey() {
  // Build list of paths to check
  const possiblePaths = [];
  
  // 1. Check GOOGLE_APPLICATION_CREDENTIALS env var (from .env or system)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    // Handle both relative and absolute paths
    const resolvedPath = path.isAbsolute(envPath) 
      ? envPath 
      : path.resolve(path.join(__dirname, '..', envPath));
    possiblePaths.push(resolvedPath);
    console.log(`${colors.blue}ℹ Checking GOOGLE_APPLICATION_CREDENTIALS: ${resolvedPath}${colors.reset}`);
  }
  
  // 2. Check common default locations
  possiblePaths.push(path.join(__dirname, 'serviceAccountKey.json'));
  possiblePaths.push(path.join(__dirname, '..', 'serviceAccountKey.json'));
  possiblePaths.push(path.join(__dirname, '..', 'secrets', 'serviceAccountKey.json'));
  possiblePaths.push(path.join(__dirname, 'secrets', 'serviceAccountKey.json'));

  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        console.log(`${colors.blue}✓ Loading service account key from: ${filePath}${colors.reset}`);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (err) {
      // Silently skip non-existent or invalid paths
    }
  }

  return null;
}

// Initialize Firebase Admin SDK
async function initializeFirebase() {
  if (!admin.apps.length) {
    const serviceAccountKey = loadServiceAccountKey();

    if (!serviceAccountKey) {
      console.error(`
${colors.red}✗ FATAL: Service account key not found!${colors.reset}

${colors.yellow}To fix this:${colors.reset}
1. Download your service account key from Firebase Console:
   - Go to https://console.firebase.google.com
   - Select your project → Project settings → Service accounts
   - Click "Generate new private key" → save the JSON file

2. Save it in one of these locations:
   - ${path.join(__dirname, 'serviceAccountKey.json')}
   - ${path.join(__dirname, 'secrets', 'serviceAccountKey.json')}
   - Or set GOOGLE_APPLICATION_CREDENTIALS environment variable:
     $env:GOOGLE_APPLICATION_CREDENTIALS="./path/to/serviceAccountKey.json"

3. Run this script again:
   npm run setup-users

${colors.red}Aborting.${colors.reset}\n`);
      process.exit(1);
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
        projectId: serviceAccountKey.project_id,
      });
    } catch (err) {
      console.error(`${colors.red}✗ FATAL: Failed to initialize Firebase: ${err.message}${colors.reset}`);
      process.exit(1);
    }
  }

  return {
    adminAuth: admin.auth(),
    adminDb: admin.firestore(),
  };
}

function generateRandomPassword(length = 16) {
  // Generate a cryptographically secure random password
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

const defaultUsers = [
  {
    username: 'Yash-777',
    email: 'yash.777@learntogether.dev',
    password: generateRandomPassword(16),
    role: 'admin',
    displayName: 'Yash (Primary Admin)',
  },
  {
    username: 'Yash-Admin',
    email: 'yash.admin@learntogether.dev',
    password: 'Admin',
    role: 'admin',
    displayName: 'Admin User',
  },
  {
    username: 'Yash-Editor',
    email: 'yash.editor@learntogether.dev',
    password: 'Editor',
    role: 'editor',
    displayName: 'Editor User',
  },
  {
    username: 'Yash-Viewer',
    email: 'yash.viewer@learntogether.dev',
    password: 'Viewer',
    role: 'viewer',
    displayName: 'Viewer User',
  },
];

async function setupUsers() {
  // Initialize Firebase
  const { adminAuth, adminDb } = await initializeFirebase();

  console.log(`\n${colors.blue}🚀 Setting up default LearnTogether users...${colors.reset}\n`);

  const createdUsers = [];
  const failedUsers = [];

  for (const user of defaultUsers) {
    try {
      console.log(`${colors.yellow}Processing user: ${user.username}...${colors.reset}`);

      let uid;
      let isNew = false;
      try {
        // Attempt to create the user in Firebase Authentication
        const userRecord = await adminAuth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.displayName,
        });
        uid = userRecord.uid;
        isNew = true;
      } catch (authError) {
        // If they exist, fetch their UID to safely sync with Firestore
        if (authError.code === 'auth/email-already-exists') {
          const existingUser = await adminAuth.getUserByEmail(user.email);
          uid = existingUser.uid;
          console.log(`${colors.yellow}⚠ User ${user.username} already exists. Syncing Firestore...${colors.reset}`);
        } else {
          throw authError;
        }
      }

      // Add/update user profile in Firestore
      await adminDb.collection('users').doc(uid).set({
        email: user.email,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        createdAt: new Date().toISOString(),
        createdBy: 'setup-script',
      }, { merge: true });

      console.log(`${colors.green}✓ ${isNew ? 'Created' : 'Synced'} ${user.username}${colors.reset}`);
      createdUsers.push({
        username: user.username,
        email: user.email,
        password: isNew ? user.password : '[Preserved]',
        role: user.role,
        uid,
      });

    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`${colors.yellow}⚠ User ${user.username} (${user.email}) already exists - skipping${colors.reset}`);
      } else {
        console.error(`${colors.red}✗ Failed to create ${user.username}: ${error.message}${colors.reset}`);
        failedUsers.push({
          username: user.username,
          error: error.message,
        });
      }
    }
  }

  // Print summary
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}DEFAULT USERS SETUP SUMMARY${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  if (createdUsers.length > 0) {
    console.log(`${colors.green}✓ Successfully created:${colors.reset}`);
    createdUsers.forEach((user) => {
      console.log(`  ${colors.green}✓${colors.reset} ${user.username}`);
      console.log(`    Email:    ${user.email}`);
      console.log(`    Password: ${user.password}`);
      console.log(`    Role:     ${user.role}`);
      console.log(`    UID:      ${user.uid}\n`);
    });
  }

  if (failedUsers.length > 0) {
    console.log(`${colors.red}✗ Failed to create:${colors.reset}`);
    failedUsers.forEach((user) => {
      console.log(`  ${colors.red}✗${colors.reset} ${user.username}`);
      console.log(`    Error: ${user.error}\n`);
    });
  }

  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  if (failedUsers.length === 0 && createdUsers.length > 0) {
    console.log(`${colors.green}All users created successfully!${colors.reset}`);
    console.log(`${colors.yellow}⚠ WARNING: Save these credentials securely.${colors.reset}`);
    console.log(`${colors.yellow}⚠ Once deployed live, replace with proper secrets management.${colors.reset}\n`);
  }

  process.exit(failedUsers.length > 0 ? 1 : 0);
}

setupUsers().catch((err) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});
