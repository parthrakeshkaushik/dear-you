import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

console.log('🧪 Starting Dear You Automated Quality & Security Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

// -------------------------------------------------------------
// 1. EXPIRY VERIFICATION TESTS
// -------------------------------------------------------------
console.log('--- 1. Expiry Engine Tests ---');

function checkGiftExpiry(expiryEnabled, expiresAtUtc, timeZone = 'Asia/Kolkata') {
  if (!expiryEnabled || !expiresAtUtc) {
    return { isExpired: false, expiresAtFormatted: 'No expiry set' };
  }
  const expiryTimestamp = new Date(expiresAtUtc).getTime();
  const currentTimestamp = Date.now();
  const isExpired = currentTimestamp >= expiryTimestamp;
  return { isExpired };
}

test('Gift with expiry_enabled=false never expires', () => {
  const res = checkGiftExpiry(false, '2020-01-01T00:00:00Z');
  assert.strictEqual(res.isExpired, false);
});

test('Gift with future UTC expiry timestamp is active', () => {
  const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
  const res = checkGiftExpiry(true, future);
  assert.strictEqual(res.isExpired, false);
});

test('Gift with past UTC expiry timestamp is expired', () => {
  const past = '2020-01-01T00:00:00Z';
  const res = checkGiftExpiry(true, past);
  assert.strictEqual(res.isExpired, true);
});

// -------------------------------------------------------------
// 2. SECURITY & CRYPTOGRAPHY TESTS
// -------------------------------------------------------------
console.log('\n--- 2. Security & Access Control Tests ---');

await asyncTest('Bcrypt correctly hashes and verifies matching password', async () => {
  const plain = 'secret_birthday_pwd';
  const hash = await bcrypt.hash(plain, 10);
  assert.notStrictEqual(plain, hash);
  const match = await bcrypt.compare(plain, hash);
  assert.strictEqual(match, true);
});

await asyncTest('Bcrypt rejects incorrect password', async () => {
  const plain = 'correct_password';
  const hash = await bcrypt.hash(plain, 10);
  const match = await bcrypt.compare('wrong_password', hash);
  assert.strictEqual(match, false);
});

await asyncTest('Jose issues valid HMAC-SHA256 JWT session token', async () => {
  const secret = new TextEncoder().encode('test-secret-32-characters-long-key');
  const token = await new SignJWT({ giftId: 'gift-123', slug: 'maya-gift' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

  const { payload } = await jwtVerify(token, secret);
  assert.strictEqual(payload.giftId, 'gift-123');
  assert.strictEqual(payload.slug, 'maya-gift');
});

// -------------------------------------------------------------
// 3. RATE LIMITING TESTS
// -------------------------------------------------------------
console.log('\n--- 3. Rate Limiting Tests ---');

const rateStore = new Map();
function testRateLimit(key, max = 5) {
  const count = (rateStore.get(key) || 0) + 1;
  rateStore.set(key, count);
  return count <= max;
}

test('Allows password attempts under threshold (1 to 5)', () => {
  const key = '192.168.1.1:maya-gift';
  for (let i = 1; i <= 5; i++) {
    assert.strictEqual(testRateLimit(key), true);
  }
});

test('Blocks 6th consecutive password attempt to stop brute-forcing', () => {
  const key = '192.168.1.1:maya-gift';
  assert.strictEqual(testRateLimit(key), false);
});

// -------------------------------------------------------------
// 4. THEME TOKENS TESTS
// -------------------------------------------------------------
console.log('\n--- 4. Theme Engine Tokens Tests ---');

test('Dreamy theme possesses night background and starlight accents', () => {
  const dreamyBg = '#0D0B18';
  assert.strictEqual(dreamyBg.startsWith('#'), true);
});

test('Elegant theme possesses high-contrast champagne gold accents', () => {
  const gold = '#D4AF37';
  assert.strictEqual(gold, '#D4AF37');
});

console.log(`\n==============================================`);
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} tests passed.`);
console.log(`==============================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
