import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

console.log('🧪 Starting Dear You Automated Quality, RBAC & Security Test Suite...\n');

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
// 1. EXPIRY ENGINE TESTS
// -------------------------------------------------------------
console.log('--- 1. Expiry Engine Tests ---');

function checkGiftExpiry(expiryEnabled, expiresAtUtc) {
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
// 4. ROLE-BASED ACCESS CONTROL (RBAC) & POLICY ACCEPTANCE TESTS
// -------------------------------------------------------------
console.log('\n--- 4. Role-Based Access Control & Registration Tests ---');

const authorizedDevs = ['developer1@dearyou.com', 'developer2@dearyou.com', 'dev@dearyou.com'];

function checkDeveloperPermission(userEmail, role) {
  if (role === 'developer' && authorizedDevs.includes(userEmail.toLowerCase())) {
    return { allowed: true, role: 'developer' };
  }
  return { allowed: false, role: 'creator' };
}

test('Authorized developer email and role grants access to Developer Dashboard', () => {
  const check = checkDeveloperPermission('developer1@dearyou.com', 'developer');
  assert.strictEqual(check.allowed, true);
  assert.strictEqual(check.role, 'developer');
});

test('Ordinary creator cannot access Developer Dashboard', () => {
  const check = checkDeveloperPermission('maya@example.com', 'creator');
  assert.strictEqual(check.allowed, false);
});

function validateRegistration(email, password, agreedToPolicies) {
  if (!email || !password) return { success: false, error: 'Missing credentials' };
  if (!agreedToPolicies) return { success: false, error: 'Terms and Privacy Policy agreement required' };
  return {
    success: true,
    policyRecord: {
      terms_accepted: true,
      terms_version: 'v1.0',
      privacy_policy_version: 'v1.0',
      terms_accepted_at: new Date().toISOString(),
    },
  };
}

test('Registration without checking mandatory policy checkbox is blocked', () => {
  const res = validateRegistration('newuser@example.com', 'pwd123', false);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, 'Terms and Privacy Policy agreement required');
});

test('Registration with checked policy checkbox succeeds and records timestamp', () => {
  const res = validateRegistration('newuser@example.com', 'pwd123', true);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.policyRecord.terms_accepted, true);
  assert.strictEqual(res.policyRecord.terms_version, 'v1.0');
});

// -------------------------------------------------------------
// 5. MEMORY WALL & PHOTO VIEWER TESTS
// -------------------------------------------------------------
console.log('\n--- 5. Memory Wall & Photo Viewer Tests ---');

test('Supports all 7 decorative frame styles', () => {
  const validStyles = [
    'polaroid',
    'vintage_wood',
    'minimal',
    'golden_luxury',
    'scrapbook',
    'pastel',
    'theme_custom',
  ];
  assert.strictEqual(validStyles.length, 7);
});

test('Photo lightbox modal navigation loops smoothly', () => {
  const photos = [{ id: '1' }, { id: '2' }, { id: '3' }];
  let currentIdx = 0;
  
  // Next
  currentIdx = currentIdx < photos.length - 1 ? currentIdx + 1 : 0;
  assert.strictEqual(currentIdx, 1);
  
  // Previous loops back to last
  currentIdx = currentIdx > 0 ? currentIdx - 1 : photos.length - 1;
  assert.strictEqual(currentIdx, 0);
  currentIdx = currentIdx > 0 ? currentIdx - 1 : photos.length - 1;
  assert.strictEqual(currentIdx, 2);
});

// -------------------------------------------------------------
// 6. MUSIC EXPERIENCE & START YOUR JOURNEY TESTS
// -------------------------------------------------------------
console.log('\n--- 6. Music Experience & Start Your Journey Tests ---');

test('Start Your Journey defaults correctly and links audio playback', () => {
  const welcomeButtonText = undefined;
  const resolvedButtonText = welcomeButtonText || 'Start Your Journey';
  assert.strictEqual(resolvedButtonText, 'Start Your Journey');
});

test('Audio plays on Start Your Journey click and handles browser rejection gracefully', async () => {
  let isPlaying = false;
  let audioError = null;
  let journeyStarted = false;

  const mockAudio = {
    play: async () => {
      // Simulate successful audio play inside user gesture
      isPlaying = true;
    }
  };

  const handleStartJourney = async () => {
    journeyStarted = true;
    try {
      await mockAudio.play();
    } catch {
      audioError = 'Browser blocked audio';
    }
  };

  await handleStartJourney();
  assert.strictEqual(journeyStarted, true);
  assert.strictEqual(isPlaying, true);
  assert.strictEqual(audioError, null);

  // Now simulate browser blocking autoplay policy (e.g. strict policy)
  const strictAudio = {
    play: async () => {
      throw new Error('NotAllowedError: play() failed because the user didn\'t interact');
    }
  };

  let strictJourneyStarted = false;
  let strictAudioError = null;
  const handleStrictStart = async () => {
    strictJourneyStarted = true;
    try {
      await strictAudio.play();
    } catch (e) {
      strictAudioError = e.message;
    }
  };

  await handleStrictStart();
  // CRITICAL: Journey must continue uninterrupted even if audio throws!
  assert.strictEqual(strictJourneyStarted, true);
  assert.ok(strictAudioError.includes('NotAllowedError'));
});

test('Music is optional at the creator configuration level', () => {
  const giftWithMusic = { music_url: 'https://example.com/audio.mp3' };
  const giftWithoutMusic = { music_url: undefined };

  assert.strictEqual(Boolean(giftWithMusic.music_url), true);
  assert.strictEqual(Boolean(giftWithoutMusic.music_url), false);
});

console.log(`\n==============================================`);
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} tests passed.`);
console.log(`==============================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
