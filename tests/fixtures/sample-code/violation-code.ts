/**
 * Sample code with compliance violations
 * Used for testing FAIL scenarios
 */

// VIOLATION: Hardcoded PII
const adminEmail = 'admin@company.com';
const supportEmail = 'support@company.com';

// VIOLATION: Hardcoded SSN
const testSSN = '123-45-6789';

// VIOLATION: Hardcoded API key
const apiKey = 'hardcoded_api_key_example_not_real';

// VIOLATION: Hardcoded password
const dbPassword = 'SuperSecret123!';

/**
 * VIOLATION: Uses HTTP instead of HTTPS
 */
export async function fetchUserDataInsecure(userId: string) {
  const url = `http://api.example.com/users/${userId}`; // HTTP!

  const response = await fetch(url);
  return response.json();
}

/**
 * VIOLATION: SQL Injection vulnerability
 */
export async function getUserByEmail(email: string) {
  // Raw SQL with user input
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  return database.query(query);
}

/**
 * VIOLATION: XSS vulnerability
 */
export function renderUserProfile(username: string) {
  // Unescaped user input
  document.body.innerHTML = `<h1>Welcome ${username}</h1>`;
}

/**
 * VIOLATION: No encryption for sensitive data
 */
export async function storeUserDataInsecure(user: any) {
  await database.insert({
    email: user.email, // Plain text email!
    ssn: user.ssn, // Plain text SSN!
    credit_card: user.creditCard, // Plain text card!
  });
}

/**
 * VIOLATION: No consent check
 */
export async function collectUserData(data: any) {
  // No consent verification
  await analytics.track(data);
  await thirdParty.send(data);
}

/**
 * VIOLATION: No data retention policy
 */
export async function storeForever(data: any) {
  // No expiration, no TTL
  await database.insert(data);
}

/**
 * VIOLATION: No deletion capability
 */
// No deleteUser function exists!

/**
 * VIOLATION: Weak crypto
 */
export function weakEncryption(data: string): string {
  // MD5 is broken
  return require('crypto').createHash('md5').update(data).digest('hex');
}

/**
 * VIOLATION: Logging sensitive data
 */
export function logUserAction(user: any) {
  console.log('User action:', {
    email: user.email, // PII in logs!
    ssn: user.ssn, // PII in logs!
    action: user.action,
  });
}

/**
 * VIOLATION: No input validation
 */
export async function updateUser(userId: string, updates: any) {
  // No validation of updates object
  await database.update(userId, updates);
}

/**
 * VIOLATION: Command injection
 */
export function runBackup(filename: string) {
  // User input in shell command
  const command = `tar -czf backup-${filename}.tar.gz /data`;
  require('child_process').execSync(command);
}

/**
 * VIOLATION: Path traversal
 */
export function readFile(filename: string) {
  // No path validation
  return require('fs').readFileSync(`/uploads/${filename}`, 'utf8');
}

// Mock database
const database = {
  query: async (sql: string) => [],
  insert: async (data: any) => data,
  update: async (id: string, data: any) => data,
};

const analytics = {
  track: async (data: any) => true,
};

const thirdParty = {
  send: async (data: any) => true,
};
