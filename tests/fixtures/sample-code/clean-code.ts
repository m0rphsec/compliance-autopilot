/**
 * Sample clean code with no compliance violations
 * Used for testing PASS scenarios
 */

import https from 'https';
import crypto from 'crypto';

interface User {
  id: string;
  username: string;
  email: string; // PII, but handled correctly
  consent: boolean;
  created_at: Date;
  expires_at: Date; // Data retention policy
}

/**
 * Fetch user data securely
 */
export async function fetchUserData(userId: string): Promise<User | null> {
  // Input validation
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }

  // Use HTTPS (secure protocol)
  const url = `https://api.example.com/users/${encodeURIComponent(userId)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`, // API key from env
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}

/**
 * Store user data with encryption
 */
export async function storeUserData(user: User): Promise<void> {
  // Validate consent
  if (!user.consent) {
    throw new Error('User consent required');
  }

  // Encrypt sensitive data
  const encryptedEmail = encryptPII(user.email);

  // Set expiration (data retention)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 day retention

  await database.insert({
    id: user.id,
    username: user.username,
    email: encryptedEmail, // Encrypted
    expires_at: expiresAt, // TTL
  });
}

/**
 * Delete user data (right to deletion)
 */
export async function deleteUserData(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('Invalid user ID');
  }

  // Hard delete from database
  await database.delete({ id: userId });

  // Delete from backups
  await backupSystem.deleteUser(userId);

  console.log(`User ${userId} deleted successfully`);
}

/**
 * Encrypt PII
 */
function encryptPII(data: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  });
}

// Mock database (for testing)
const database = {
  insert: async (data: any) => data,
  delete: async (query: any) => true,
};

const backupSystem = {
  deleteUser: async (userId: string) => true,
};
