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

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

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
  console.log(`\n${colors.blue}🚀 Setting up default LearnTogether users...${colors.reset}\n`);

  const createdUsers = [];
  const failedUsers = [];

  for (const user of defaultUsers) {
    try {
      console.log(`${colors.yellow}Creating user: ${user.username}...${colors.reset}`);
      
      // Create user in Firebase Authentication
      const userRecord = await adminAuth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });

      // Add user role to Firestore
      await adminDb.collection('users').doc(userRecord.uid).set({
        email: user.email,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        createdAt: new Date().toISOString(),
        createdBy: 'setup-script',
      });

      console.log(`${colors.green}✓ Created ${user.username}${colors.reset}`);
      
      createdUsers.push({
        username: user.username,
        email: user.email,
        password: user.password,
        role: user.role,
        uid: userRecord.uid,
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
