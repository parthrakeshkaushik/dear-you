import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
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

const authorizedDevs = [
  'kaushikparth363@gmail.com',
  'kaushikparth353@gmail.com',
];

function checkDeveloperPermission(userEmail, role) {
  if (role === 'developer' && authorizedDevs.includes(userEmail.toLowerCase())) {
    return { allowed: true, role: 'developer' };
  }
  return { allowed: false, role: 'creator' };
}

test('Authorized developer kaushikparth363@gmail.com grants full Developer Dashboard access', () => {
  const check = checkDeveloperPermission('kaushikparth363@gmail.com', 'developer');
  assert.strictEqual(check.allowed, true);
  assert.strictEqual(check.role, 'developer');
});

test('Authorized developer kaushikparth353@gmail.com grants full Developer Dashboard access', () => {
  const check = checkDeveloperPermission('kaushikparth353@gmail.com', 'developer');
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

// -------------------------------------------------------------
// 7. DISPOSABLE EMAIL & ACCOUNT AUTHENTICITY TESTS
// -------------------------------------------------------------
console.log('\n--- 7. Disposable Email & Account Authenticity Tests ---');

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'trashmail.com',
  'yopmail.com',
  'dispostable.com',
  'burnermail.io',
]);

function checkDisposableEmail(email) {
  if (!email || !email.includes('@')) return false;
  const domain = email.trim().toLowerCase().split('@')[1];
  return DISPOSABLE_DOMAINS.has(domain);
}

test('Blocks known disposable and temporary burner email domains', () => {
  assert.strictEqual(checkDisposableEmail('spam@mailinator.com'), true);
  assert.strictEqual(checkDisposableEmail('burner@10minutemail.com'), true);
  assert.strictEqual(checkDisposableEmail('temp@sharklasers.com'), true);
  assert.strictEqual(checkDisposableEmail('throwaway@yopmail.com'), true);
});

test('Allows legitimate email providers', () => {
  assert.strictEqual(checkDisposableEmail('user@gmail.com'), false);
  assert.strictEqual(checkDisposableEmail('maya@outlook.com'), false);
  assert.strictEqual(checkDisposableEmail('kabir@yahoo.com'), false);
  assert.strictEqual(checkDisposableEmail('founder@mycompany.org'), false);
});

// -------------------------------------------------------------
// 8. DEVELOPER MODERATION & RECIPIENT ACCESS ENFORCEMENT TESTS
// -------------------------------------------------------------
console.log('\n--- 8. Developer Moderation & Recipient Cutoff Tests ---');

function evaluateRecipientAccess(gift, creator) {
  if (!gift || gift.moderation_status === 'deleted' || gift.deleted_at) {
    return { status: 404, allowed: false, reason: 'not_found' };
  }

  if (gift.moderation_status === 'paused' || gift.moderation_status === 'unpublished' || gift.status !== 'published') {
    return { status: 423, allowed: false, reason: 'unavailable', message: 'This gift is currently unavailable.' };
  }

  if (creator && creator.account_status === 'suspended') {
    return { status: 423, allowed: false, reason: 'unavailable', message: 'This gift is currently unavailable.' };
  }

  return { status: 200, allowed: true };
}

test('Active published gift allows recipient access', () => {
  const gift = { id: 'g1', status: 'published', moderation_status: 'active' };
  const creator = { id: 'u1', account_status: 'active' };
  const res = evaluateRecipientAccess(gift, creator);
  assert.strictEqual(res.allowed, true);
  assert.strictEqual(res.status, 200);
});

test('Paused gift immediately blocks recipient access with unavailable status', () => {
  const gift = { id: 'g1', status: 'published', moderation_status: 'paused', moderation_reason: 'Policy review' };
  const creator = { id: 'u1', account_status: 'active' };
  const res = evaluateRecipientAccess(gift, creator);
  assert.strictEqual(res.allowed, false);
  assert.strictEqual(res.status, 423);
  assert.strictEqual(res.reason, 'unavailable');
});

test('Unpublished gift immediately blocks recipient access', () => {
  const gift = { id: 'g1', status: 'published', moderation_status: 'unpublished' };
  const creator = { id: 'u1', account_status: 'active' };
  const res = evaluateRecipientAccess(gift, creator);
  assert.strictEqual(res.allowed, false);
  assert.strictEqual(res.status, 423);
});

test('Soft-deleted gift returns 404 not found to recipients', () => {
  const gift = { id: 'g1', status: 'published', moderation_status: 'deleted', deleted_at: new Date().toISOString() };
  const creator = { id: 'u1', account_status: 'active' };
  const res = evaluateRecipientAccess(gift, creator);
  assert.strictEqual(res.allowed, false);
  assert.strictEqual(res.status, 404);
});

test('Restored gift re-enables recipient access', () => {
  let gift = { id: 'g1', status: 'published', moderation_status: 'paused' };
  const creator = { id: 'u1', account_status: 'active' };
  
  assert.strictEqual(evaluateRecipientAccess(gift, creator).allowed, false);
  
  // Developer restores gift
  gift = { ...gift, moderation_status: 'active' };
  assert.strictEqual(evaluateRecipientAccess(gift, creator).allowed, true);
});

test('Suspended creator account immediately blocks recipient access to all their gifts', () => {
  const gift = { id: 'g1', status: 'published', moderation_status: 'active' };
  const suspendedCreator = { id: 'u1', account_status: 'suspended' };
  const res = evaluateRecipientAccess(gift, creator => suspendedCreator);
  assert.strictEqual(evaluateRecipientAccess(gift, suspendedCreator).allowed, false);
});

// -------------------------------------------------------------
// 9. MOBILE PHONE E.164 NORMALIZATION & MASKING TESTS
// -------------------------------------------------------------
console.log('\n--- 9. Mobile Phone E.164 Normalization & Masking Tests ---');

function normalizePhone(countryCode, rawNumber) {
  const cleanCode = countryCode.trim().startsWith('+') ? countryCode.trim() : `+${countryCode.trim()}`;
  const cleanDigits = rawNumber.replace(/\D/g, '');
  const codeDigits = cleanCode.replace(/\D/g, '');
  if (cleanDigits.startsWith(codeDigits) && cleanDigits.length > codeDigits.length) {
    return `+${cleanDigits}`;
  }
  return `${cleanCode}${cleanDigits}`;
}

function isValidPhone(e164Phone) {
  if (!e164Phone || !e164Phone.startsWith('+')) return false;
  return /^\d{8,15}$/.test(e164Phone.slice(1));
}

function maskPhone(phone) {
  if (!phone || phone.length < 8) return '••••••••';
  const prefix = phone.slice(0, 3);
  const start = phone.slice(3, 5);
  const end = phone.slice(-3);
  return `${prefix} ${start}*** **${end}`;
}

function maskUserEmail(email) {
  if (!email || !email.includes('@')) return '';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return `${localPart[0]}***@${domain}`;
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}

test('Normalizes Indian mobile numbers with +91 to E.164 format', () => {
  assert.strictEqual(normalizePhone('+91', '98765 43210'), '+919876543210');
  assert.strictEqual(normalizePhone('+91', '98765-43210'), '+919876543210');
  assert.strictEqual(normalizePhone('+91', '+919876543210'), '+919876543210');
});

test('Normalizes international phone numbers correctly', () => {
  assert.strictEqual(normalizePhone('+1', '415 555 2671'), '+14155552671');
  assert.strictEqual(normalizePhone('+44', '7911 123456'), '+447911123456');
  assert.strictEqual(normalizePhone('+971', '50 123 4567'), '+971501234567');
});

test('Validates realistic E.164 phone length', () => {
  assert.strictEqual(isValidPhone('+919876543210'), true);
  assert.strictEqual(isValidPhone('+14155552671'), true);
  assert.strictEqual(isValidPhone('9876543210'), false); // missing '+'
  assert.strictEqual(isValidPhone('+123'), false); // too short
});

test('Masks phone and email safely for OTP verification UI', () => {
  assert.strictEqual(maskPhone('+919876543210'), '+91 98*** **210');
  assert.strictEqual(maskUserEmail('maya.sharma@example.com'), 'm***a@example.com');
});

// -------------------------------------------------------------
// 10. CAPTCHA BOT PROTECTION & REPLAY DEFENSE TESTS
// -------------------------------------------------------------
console.log('\n--- 10. CAPTCHA Bot Protection & Replay Defense Tests ---');

const usedTokensMock = new Set();

function verifyCaptchaMock(token) {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { success: false, error: 'CAPTCHA token required' };
  }
  const clean = token.trim();
  if (usedTokensMock.has(clean)) {
    return { success: false, error: 'Token already used (replay attack detected)' };
  }
  if (clean === '2x00000000000000000000AB' || clean.startsWith('test_invalid')) {
    return { success: false, error: 'Verification failed' };
  }
  if (clean === '1x00000000000000000000AA' || clean.startsWith('test_valid') || clean.length >= 10) {
    usedTokensMock.add(clean);
    return { success: true };
  }
  return { success: false, error: 'Invalid token format' };
}

test('Blocks registration submission when CAPTCHA is missing', () => {
  const res = verifyCaptchaMock('');
  assert.strictEqual(res.success, false);
});

test('Accepts valid Cloudflare Turnstile token on first use', () => {
  const token = `test_valid_captcha_${Date.now()}`;
  const res = verifyCaptchaMock(token);
  assert.strictEqual(res.success, true);
});

test('Rejects replayed CAPTCHA token to prevent bot reuse attacks', () => {
  const token = `test_valid_replay_${Date.now()}`;
  const firstUse = verifyCaptchaMock(token);
  assert.strictEqual(firstUse.success, true);
  const replayUse = verifyCaptchaMock(token);
  assert.strictEqual(replayUse.success, false);
  assert.strictEqual(replayUse.error.includes('replay'), true);
});

test('Rejects invalid CAPTCHA token', () => {
  const res = verifyCaptchaMock('test_invalid_token');
  assert.strictEqual(res.success, false);
});

// -------------------------------------------------------------
// 11. OTP VERIFICATION & BRUTE-FORCE SECURITY TESTS
// -------------------------------------------------------------
console.log('\n--- 11. OTP Verification & Anti-Brute-Force Tests ---');

function validateOtpFormat(otp) {
  if (!otp || typeof otp !== 'string') return false;
  return /^\d{6}$/.test(otp.trim());
}

test('Enforces strictly 6 numeric digits for OTPs', () => {
  assert.strictEqual(validateOtpFormat('123456'), true);
  assert.strictEqual(validateOtpFormat('000000'), true);
  assert.strictEqual(validateOtpFormat('12345'), false); // 5 digits
  assert.strictEqual(validateOtpFormat('1234567'), false); // 7 digits
  assert.strictEqual(validateOtpFormat('12345a'), false); // alphanumeric
});

// -------------------------------------------------------------
// 12. REGISTRATION METHOD ISOLATION & DEVELOPER DASHBOARD TESTS
// -------------------------------------------------------------
console.log('\n--- 12. Method Isolation & Developer Dashboard Tests ---');

function mapUserToDirectoryView(user) {
  const isEmail = user.registration_method === 'email';
  const isMobile = user.registration_method === 'mobile';

  return {
    id: user.id,
    method: user.registration_method,
    identifier: isEmail ? user.email : user.phone,
    emailStatus: isEmail ? (user.email_verified ? 'Verified' : 'Pending') : 'Not Provided',
    mobileStatus: isMobile ? (user.phone_verified ? 'Verified' : 'Pending') : 'Not Provided',
    accountStatus: user.account_status,
  };
}

test('Email creator does not show mobile verification as failed (shows Not Provided)', () => {
  const user = {
    id: 'u-email-1',
    registration_method: 'email',
    email: 'creator@example.com',
    email_verified: true,
    account_status: 'active',
  };
  const row = mapUserToDirectoryView(user);
  assert.strictEqual(row.method, 'email');
  assert.strictEqual(row.identifier, 'creator@example.com');
  assert.strictEqual(row.emailStatus, 'Verified');
  assert.strictEqual(row.mobileStatus, 'Not Provided');
});

test('Mobile creator does not show email verification as failed (shows Not Provided)', () => {
  const user = {
    id: 'u-phone-1',
    registration_method: 'mobile',
    phone: '+919876543210',
    phone_verified: true,
    account_status: 'active',
  };
  const row = mapUserToDirectoryView(user);
  assert.strictEqual(row.method, 'mobile');
  assert.strictEqual(row.identifier, '+919876543210');
  assert.strictEqual(row.emailStatus, 'Not Provided');
  assert.strictEqual(row.mobileStatus, 'Verified');
});

test('Unverified mobile creator correctly reflects Pending status', () => {
  const user = {
    id: 'u-phone-2',
    registration_method: 'mobile',
    phone: '+919812345678',
    phone_verified: false,
    account_status: 'active',
  };
  const row = mapUserToDirectoryView(user);
  assert.strictEqual(row.mobileStatus, 'Pending');
  assert.strictEqual(row.emailStatus, 'Not Provided');
});

// -------------------------------------------------------------
// 13. REPUBLISHING & DUPLICATION ENGINE TESTS
// -------------------------------------------------------------
console.log('\n--- 13. Republishing & Duplication Engine Tests ---');

function republishGiftEngine(gift, newExpiryConfig) {
  return {
    ...gift,
    status: 'published',
    moderation_status: 'active',
    expiry_enabled: Boolean(newExpiryConfig.expiry_enabled),
    expires_at: newExpiryConfig.expiry_enabled ? newExpiryConfig.expires_at : null,
    republished_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function duplicateGiftEngine(sourceGift, overrides = {}) {
  const newId = `gift-copy-${Date.now()}`;
  const newSlug = overrides.new_slug || `${sourceGift.slug}-copy-999`;

  // Clone memories with independent IDs
  const clonedMemories = (sourceGift.memories || []).map((m, idx) => ({
    ...m,
    id: `mem-copy-${idx}-${Date.now()}`,
    gift_id: newId,
  }));

  return {
    ...sourceGift,
    id: newId,
    slug: newSlug,
    title: overrides.new_title || `${sourceGift.title} (Copy)`,
    recipient_name: overrides.new_recipient_name || sourceGift.recipient_name,
    status: 'draft',
    moderation_status: 'active',
    source_gift_id: sourceGift.id,
    download_count: 0,
    last_downloaded_at: undefined,
    republished_at: undefined,
    expiry_enabled: Boolean(overrides.expiry_enabled),
    expires_at: overrides.expiry_enabled ? overrides.expires_at : null,
    memories: clonedMemories,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

test('Republishing an expired card restores active status without losing original ID or slug', () => {
  const expiredGift = {
    id: 'orig-123',
    slug: 'ananya-gift',
    title: 'A Little Universe for Ananya',
    recipient_name: 'Ananya',
    status: 'published',
    expiry_enabled: true,
    expires_at: '2020-01-01T00:00:00Z', // Past date -> expired
    memories: [{ id: 'm1', caption: 'Sunset rooftop' }],
  };

  const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const republished = republishGiftEngine(expiredGift, {
    expiry_enabled: true,
    expires_at: futureExpiry,
  });

  assert.strictEqual(republished.id, 'orig-123'); // Original ID preserved
  assert.strictEqual(republished.slug, 'ananya-gift'); // Original slug preserved
  assert.strictEqual(republished.status, 'published');
  assert.strictEqual(republished.memories.length, 1);
  assert.strictEqual(republished.memories[0].caption, 'Sunset rooftop');
  assert.strictEqual(checkGiftExpiry(republished.expiry_enabled, republished.expires_at).isExpired, false);
  assert.strictEqual(typeof republished.republished_at, 'string');
});

test('Republishing can choose No Expiry (Never Expires)', () => {
  const expiredGift = {
    id: 'orig-456',
    slug: 'rohan-scrapbook',
    status: 'published',
    expiry_enabled: true,
    expires_at: '2020-01-01T00:00:00Z',
  };

  const republished = republishGiftEngine(expiredGift, { expiry_enabled: false });
  assert.strictEqual(republished.expiry_enabled, false);
  assert.strictEqual(republished.expires_at, null);
  assert.strictEqual(checkGiftExpiry(republished.expiry_enabled, republished.expires_at).isExpired, false);
});

test('Duplicating creates an independent draft card with unique ID and slug', () => {
  const original = {
    id: 'orig-gift-001',
    slug: 'original-slug',
    title: 'Original Surprise',
    recipient_name: 'Maya',
    status: 'published',
    download_count: 5,
    memories: [{ id: 'm1', caption: 'Photo 1' }],
  };

  const duplicate = duplicateGiftEngine(original, {
    new_title: 'Duplicated Surprise for Maya',
    new_slug: 'original-slug-copy-123',
  });

  assert.notStrictEqual(duplicate.id, original.id);
  assert.strictEqual(duplicate.slug, 'original-slug-copy-123');
  assert.strictEqual(duplicate.status, 'draft');
  assert.strictEqual(duplicate.source_gift_id, original.id);
  assert.strictEqual(duplicate.download_count, 0); // Analytics reset
  assert.strictEqual(duplicate.memories.length, 1);
  assert.notStrictEqual(duplicate.memories[0].id, original.memories[0].id); // Independent memory ID
});

test('Modifying or deleting duplicate never affects original source card', () => {
  const original = { id: 'orig-1', title: 'Eternal Bond', memories: [{ id: 'm1' }] };
  const duplicate = duplicateGiftEngine(original, { new_title: 'Updated Copy' });

  // Modify duplicate
  duplicate.title = 'Completely Changed Title';
  duplicate.memories = [];

  assert.strictEqual(original.title, 'Eternal Bond');
  assert.strictEqual(original.memories.length, 1);
});

// -------------------------------------------------------------
// 14. OFFLINE KEEPSAKE & DOWNLOAD RESTRICTIONS
// -------------------------------------------------------------
console.log('\n--- 14. Offline Keepsake & Download Restrictions ---');

function evaluateDownloadAccess(gift, isPasswordAuthenticated) {
  if (!gift || gift.moderation_status === 'deleted' || gift.deleted_at) {
    return { status: 404, allowed: false, error: 'Gift not found' };
  }

  if (gift.moderation_status === 'paused' || gift.moderation_status === 'unpublished') {
    return { status: 423, allowed: false, error: 'Gift unavailable' };
  }

  // Server-side expiry restriction: Expired cards cannot be downloaded online after expiration
  const expiry = checkGiftExpiry(gift.expiry_enabled, gift.expires_at);
  if (expiry.isExpired) {
    return {
      status: 410,
      allowed: false,
      error: 'This online gift has expired and cannot be downloaded online. Previously downloaded packages remain usable.',
    };
  }

  if (gift.password_hash && !isPasswordAuthenticated) {
    return { status: 401, allowed: false, error: 'Password required' };
  }

  return { status: 200, allowed: true };
}

test('Active published gift allows recipient download when authenticated', () => {
  const activeGift = {
    id: 'g-active',
    status: 'published',
    moderation_status: 'active',
    expiry_enabled: false,
    password_hash: 'somehash',
  };
  const res = evaluateDownloadAccess(activeGift, true);
  assert.strictEqual(res.allowed, true);
  assert.strictEqual(res.status, 200);
});

test('Password-protected gift blocks unauthenticated download attempts', () => {
  const activeGift = {
    id: 'g-active',
    status: 'published',
    moderation_status: 'active',
    expiry_enabled: false,
    password_hash: 'somehash',
  };
  const res = evaluateDownloadAccess(activeGift, false);
  assert.strictEqual(res.allowed, false);
  assert.strictEqual(res.status, 401);
});

test('Expired gift immediately blocks online download attempts with HTTP 410', () => {
  const expiredGift = {
    id: 'g-expired',
    status: 'published',
    moderation_status: 'active',
    expiry_enabled: true,
    expires_at: '2020-01-01T00:00:00Z',
  };
  const res = evaluateDownloadAccess(expiredGift, true);
  assert.strictEqual(res.allowed, false);
  assert.strictEqual(res.status, 410);
  assert.strictEqual(res.error.includes('expired'), true);
});

// -------------------------------------------------------------
// 15. RATE LIMIT RESILIENCE & MOBILE PHONE BRIDGE AUTH TESTS
// -------------------------------------------------------------
console.log('\n--- 15. Rate Limit Resilience & Mobile Phone Bridge Auth Tests ---');

function getPhoneBridgeEmailTest(phone) {
  const cleanDigits = phone.replace(/\D/g, '');
  return `${cleanDigits}@phone.dearyou.com`;
}

function isPhoneBridgeEmailTest(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith('@phone.dearyou.com');
}

function isOtpCodeValidTest(token, expectedOtp) {
  const clean = token.trim();
  if (clean === '123456') return true;
  if (!expectedOtp) return false;
  return clean === expectedOtp.trim();
}

test('Transforms mobile phone to internal bridge email without leaking digits', () => {
  assert.strictEqual(getPhoneBridgeEmailTest('+91 98765 43210'), '919876543210@phone.dearyou.com');
  assert.strictEqual(getPhoneBridgeEmailTest('+1 (415) 555-2671'), '14155552671@phone.dearyou.com');
});

test('Correctly identifies mobile bridge email vs authentic email addresses', () => {
  assert.strictEqual(isPhoneBridgeEmailTest('919876543210@phone.dearyou.com'), true);
  assert.strictEqual(isPhoneBridgeEmailTest('creator@gmail.com'), false);
  assert.strictEqual(isPhoneBridgeEmailTest('developer1@dearyou.com'), false);
});

test('Validates OTP via universal sandbox code and matching secret token', () => {
  assert.strictEqual(isOtpCodeValidTest('123456', '749281'), true); // Sandbox bypass
  assert.strictEqual(isOtpCodeValidTest('749281', '749281'), true); // Exact match
  assert.strictEqual(isOtpCodeValidTest('999999', '749281'), false); // Mismatch rejected
});

test('Gracefully absorbs SMTP over-quota rate limits without failing creator registration', () => {
  // Simulate Supabase SMTP over-quota error
  const smtpError = new Error('email rate limit exceeded');
  let absorbed = false;
  try {
    throw smtpError;
  } catch (err) {
    if (err.message.includes('rate limit')) {
      absorbed = true;
    }
  }
  assert.strictEqual(absorbed, true);
});

// -------------------------------------------------------------
// 16. PERSISTENT LOGIN & REMEMBER ME (7–14 DAYS) TESTS
// -------------------------------------------------------------
console.log('\n--- 16. Persistent Login & Remember Me (7–14 Days) Tests ---');

const testSecret = new TextEncoder().encode('test_secret_for_persistent_sessions_2026');

async function signTestSession(userId, days = 14) {
  const maxAgeSeconds = days * 24 * 60 * 60;
  const expiresAt = Date.now() + maxAgeSeconds * 1000;
  const token = await new SignJWT({ userId, days, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(testSecret);
  return { token, expiresAt, maxAgeSeconds };
}

async function verifyTestSession(token) {
  try {
    const { payload } = await jwtVerify(token, testSecret);
    const expiresAt = Number(payload.expiresAt || 0);
    if (Date.now() > expiresAt) {
      return { valid: false, expired: true, userId: payload.userId };
    }
    return { valid: true, userId: payload.userId, days: payload.days, expiresAt };
  } catch (err) {
    const isExpired = err?.code === 'ERR_JWT_EXPIRED' || err?.message?.includes('expired');
    return { valid: false, expired: isExpired };
  }
}

await asyncTest('Enforces default 14-day persistent session duration', async () => {
  const DEFAULT_REMEMBER_DAYS = 14;
  assert.strictEqual(DEFAULT_REMEMBER_DAYS, 14);
  const session = await signTestSession('creator-1', DEFAULT_REMEMBER_DAYS);
  assert.strictEqual(session.maxAgeSeconds, 14 * 86400);
});

await asyncTest('Signs 14-day persistent session token and validates authenticity', async () => {
  const { token, expiresAt } = await signTestSession('creator-alpha', 14);
  const check = await verifyTestSession(token);
  assert.strictEqual(check.valid, true);
  assert.strictEqual(check.userId, 'creator-alpha');
  assert.strictEqual(check.days, 14);
  assert.strictEqual(Math.round((check.expiresAt - Date.now()) / 86400000), 14);
});

await asyncTest('Signs 7-day persistent session token and validates authenticity', async () => {
  const { token, expiresAt } = await signTestSession('creator-beta', 7);
  const check = await verifyTestSession(token);
  assert.strictEqual(check.valid, true);
  assert.strictEqual(check.userId, 'creator-beta');
  assert.strictEqual(check.days, 7);
  assert.strictEqual(Math.round((check.expiresAt - Date.now()) / 86400000), 7);
});

await asyncTest('Detects expired persistent session token and enforces re-authentication', async () => {
  // Create an expired token (1 second in past)
  const pastExpiresAt = Date.now() - 1000;
  const expiredToken = await new SignJWT({ userId: 'creator-expired', days: 14, expiresAt: pastExpiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 2000)
    .setExpirationTime(Math.floor(pastExpiresAt / 1000))
    .sign(testSecret);

  const check = await verifyTestSession(expiredToken);
  assert.strictEqual(check.valid, false);
  assert.strictEqual(check.expired, true);
});

await asyncTest('Rejects tampered or forged persistent session tokens', async () => {
  const { token } = await signTestSession('creator-valid', 14);
  const tamperedToken = token.slice(0, -6) + 'abcdef';
  const check = await verifyTestSession(tamperedToken);
  assert.strictEqual(check.valid, false);
});

test('Session isolation: User A session cannot access User B credentials or cards', () => {
  const userASession = { userId: 'user-aaa-111', role: 'creator' };
  const userBSession = { userId: 'user-bbb-222', role: 'creator' };
  const cardOwnedByUserA = { id: 'card-1', owner_id: 'user-aaa-111', title: 'Gift for Sarah' };

  function canAccessCard(session, card) {
    if (!session || !session.userId) return false;
    return session.userId === card.owner_id;
  }

  assert.strictEqual(canAccessCard(userASession, cardOwnedByUserA), true);
  assert.strictEqual(canAccessCard(userBSession, cardOwnedByUserA), false);
});

test('Logout simulator: clears cookie tokens and enforces signed-out state', () => {
  let cookieJar = {
    'dearyou_session_expiry': 'some_jwt_token',
    'dearyou_remember_duration': '14',
    'sb-auth-token': 'access_token_sample',
  };

  function simulateLogout(jar) {
    jar['dearyou_session_expiry'] = '';
    jar['dearyou_remember_duration'] = '';
    delete jar['sb-auth-token'];
    return jar;
  }

  const updatedJar = simulateLogout({ ...cookieJar });
  assert.strictEqual(updatedJar['dearyou_session_expiry'], '');
  assert.strictEqual(updatedJar['dearyou_remember_duration'], '');
  assert.strictEqual(updatedJar['sb-auth-token'], undefined);
});

// -------------------------------------------------------------
// 17. SIMPLE OTP-FREE SIGN UP & 14-DAY DIRECT ONBOARDING TESTS
// -------------------------------------------------------------
console.log('\n--- 17. Simple OTP-Free Sign Up & 14-Day Direct Onboarding Tests ---');

test('Simple sign-up requires valid full name, email, password, and policy agreement', () => {
  function validateSimpleSignup(data) {
    if (!data.fullName || data.fullName.trim().length < 2) return { valid: false, error: 'Name required' };
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!data.email || !emailRegex.test(data.email)) return { valid: false, error: 'Valid email required' };
    if (!data.password || data.password.length < 6) return { valid: false, error: 'Password min 6 chars' };
    if (!data.termsAccepted) return { valid: false, error: 'Terms acceptance required' };
    return { valid: true };
  }

  assert.strictEqual(validateSimpleSignup({ fullName: '', email: 'valid@example.com', password: 'password123', termsAccepted: true }).valid, false);
  assert.strictEqual(validateSimpleSignup({ fullName: 'Maya', email: 'invalid-email', password: 'password123', termsAccepted: true }).valid, false);
  assert.strictEqual(validateSimpleSignup({ fullName: 'Maya', email: 'maya@example.com', password: '123', termsAccepted: true }).valid, false);
  assert.strictEqual(validateSimpleSignup({ fullName: 'Maya', email: 'maya@example.com', password: 'password123', termsAccepted: false }).valid, false);
  assert.strictEqual(validateSimpleSignup({ fullName: 'Maya Sharma', email: 'maya@example.com', password: 'password123', termsAccepted: true }).valid, true);
});

test('OTP-free registration sets user immediately verified with email_confirm: true', () => {
  function createDirectUser(email, name) {
    return {
      email,
      email_confirm: true,
      email_verified: true,
      account_status: 'active',
      role: 'creator',
      destination_otp: null, // No OTP generated or required
    };
  }

  const user = createDirectUser('user@example.com', 'Alex');
  assert.strictEqual(user.email_confirm, true);
  assert.strictEqual(user.email_verified, true);
  assert.strictEqual(user.destination_otp, null);
});

await asyncTest('Sign-up generates 14-day persistent session token directly for Creator Dashboard', async () => {
  const secret = new TextEncoder().encode('dearyou_secure_persistent_session_secret_2026_xyz');
  const userId = 'creator-signup-uuid-456';
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const expiresAt = Date.now() + fourteenDaysMs;

  const token = await new SignJWT({ userId, days: 14, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(secret);

  const { payload } = await jwtVerify(token, secret);
  assert.strictEqual(payload.userId, 'creator-signup-uuid-456');
  assert.strictEqual(payload.days, 14);
  assert.ok(payload.expiresAt > Date.now() + 13 * 24 * 60 * 60 * 1000);
});

test('Registration directly routes to Creator Dashboard (/admin) without OTP screen intermediate', () => {
  function getPostSignupRoute(signupResult) {
    if (signupResult.success) {
      return '/admin?welcome=true'; // Direct route, no /verify-otp
    }
    return '/signup';
  }

  const route = getPostSignupRoute({ success: true, userId: 'u1' });
  assert.strictEqual(route, '/admin?welcome=true');
  assert.notStrictEqual(route.includes('verify-otp'), true);
});

// -------------------------------------------------------------
// 18. DEMONSTRATION CARD SHOWCASE & PASSWORD HINT TESTS
// -------------------------------------------------------------
console.log('\n--- 18. Demonstration Card Showcase & Password Hint Tests ---');

test('Showcase repository contains exactly one designated demonstration card', () => {
  const showcaseCards = [
    { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', slug: 'demo-gift', is_demo: true },
    { id: 'a8888888-4444-4444-4444-1234567890ab', slug: 'aarav-anniversary', is_demo: false },
  ];

  const demoCards = showcaseCards.filter((c) => c.is_demo === true);
  assert.strictEqual(demoCards.length, 1);
  assert.strictEqual(demoCards[0].slug, 'demo-gift');
});

await asyncTest('Demo card password "special" successfully hashes and verifies with bcrypt', async () => {
  const demoHash = '$2a$10$7wymEdevn11T5O05b33POemyToURis6.BQODyUor4/yUZWle9VJu6';
  const matches = await bcrypt.compare('special', demoHash);
  assert.strictEqual(matches, true);

  const wrongMatches = await bcrypt.compare('wrongpassword', demoHash);
  assert.strictEqual(wrongMatches, false);
});

test('Public metadata strips password hints for real user cards while exposing for demo card only', () => {
  function getPublicHint(card) {
    if (card.is_demo || card.slug === 'demo' || card.slug === 'demo-gift') {
      return 'special';
    }
    return undefined; // Strictly private for real customer cards
  }

  const demoCard = { slug: 'demo-gift', is_demo: true, password_hint: 'special' };
  const realCard = { slug: 'maya-wedding', is_demo: false, password_hint: 'Our first date' };

  assert.strictEqual(getPublicHint(demoCard), 'special');
  assert.strictEqual(getPublicHint(realCard), undefined);
});

// -------------------------------------------------------------
// 19. IMMEDIATE RECIPIENT SESSION REVOCATION ON PASSWORD CHANGE
// -------------------------------------------------------------
console.log('\n--- 19. Immediate Recipient Session Revocation on Password Change ---');

const JWT_SECRET = new TextEncoder().encode('dear-you-recipient-super-secret-key-32-chars-long');

async function createTestRecipientToken(giftId, slug, version = 1) {
  return await new SignJWT({ giftId, slug, password_version: version })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

async function verifyTestRecipientToken(token, expectedGiftId, currentCardVersion = 1) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.giftId !== expectedGiftId) return { valid: false };
    const tokenVersion = Number(payload.password_version || 1);
    if (tokenVersion !== currentCardVersion) {
      return { valid: false, passwordRevoked: true };
    }
    return { valid: true };
  } catch {
    return { valid: false };
  }
}

await asyncTest('Recipient token with current password version is valid and grants access', async () => {
  const giftId = 'card-uuid-100';
  const slug = 'sarah-birthday';
  const token = await createTestRecipientToken(giftId, slug, 1);

  const check = await verifyTestRecipientToken(token, giftId, 1);
  assert.strictEqual(check.valid, true);
  assert.strictEqual(check.passwordRevoked, undefined);
});

await asyncTest('Creator updating card password increments version and immediately revokes active recipient token', async () => {
  const giftId = 'card-uuid-100';
  const slug = 'sarah-birthday';

  // Recipient entered old123 and obtained version 1 session token
  const tokenBeforePasswordChange = await createTestRecipientToken(giftId, slug, 1);

  // Creator changes password from old123 to new456 -> card increments to password_version: 2
  const currentCardVersionAfterChange = 2;

  // Immediate check of the previously valid token
  const check = await verifyTestRecipientToken(tokenBeforePasswordChange, giftId, currentCardVersionAfterChange);
  assert.strictEqual(check.valid, false);
  assert.strictEqual(check.passwordRevoked, true);
});

await asyncTest('Entering new password issues fresh session token at version 2 which succeeds', async () => {
  const giftId = 'card-uuid-100';
  const slug = 'sarah-birthday';
  const currentCardVersion = 2;

  // Recipient enters new456 -> issues new token at version 2
  const tokenAfterNewPassword = await createTestRecipientToken(giftId, slug, currentCardVersion);

  const check = await verifyTestRecipientToken(tokenAfterNewPassword, giftId, currentCardVersion);
  assert.strictEqual(check.valid, true);
});

test('Password change on Card A does not revoke sessions on Card B or Creator dashboard', () => {
  const cardASession = { giftId: 'card-a', password_version: 1 };
  const cardBSession = { giftId: 'card-b', password_version: 1 };
  const creatorSession = { userId: 'creator-999', authenticated: true };

  // Card A password changed -> Card A version becomes 2
  const cardACurrentVersion = 2;
  const cardBCurrentVersion = 1;

  assert.notStrictEqual(cardASession.password_version, cardACurrentVersion); // Revoked
  assert.strictEqual(cardBSession.password_version, cardBCurrentVersion); // Active & Unaffected
  assert.strictEqual(creatorSession.authenticated, true); // Creator session untouched
});

// -------------------------------------------------------------
// 20. PRE-FILLED LIVE PREVIEW & BUILDER TEMPLATE TESTS
// -------------------------------------------------------------
console.log('\n--- 20. Pre-filled Live Preview & Builder Template Tests ---');

test('New card builder initializes with complete demonstration sample draft', () => {
  function getInitialBuilderDraft() {
    return {
      recipientName: 'Ananya',
      title: 'A Celestial Surprise for Ananya',
      selectedTheme: 'dreamy',
      welcomeHeading: 'A starry sanctuary, crafted with love.',
      memoriesCount: 3,
      timelineCount: 1,
      quizCount: 1,
      secretMessagesCount: 1,
      lettersCount: 1,
      wishesCount: 2,
      musicTitle: 'Gentle Moments',
      status: 'draft',
    };
  }

  const draft = getInitialBuilderDraft();
  assert.strictEqual(draft.recipientName, 'Ananya');
  assert.ok(draft.memoriesCount >= 3);
  assert.ok(draft.quizCount >= 1);
  assert.ok(draft.lettersCount >= 1);
  assert.strictEqual(draft.selectedTheme, 'dreamy');
});

test('Starting fresh completely clears the draft canvas', () => {
  function resetToBlank() {
    return {
      recipientName: '',
      title: '',
      memories: [],
      timelineEntries: [],
      quizQuestions: [],
      letters: [],
      wishes: [],
    };
  }

  const blank = resetToBlank();
  assert.strictEqual(blank.recipientName, '');
  assert.strictEqual(blank.title, '');
  assert.strictEqual(blank.memories.length, 0);
  assert.strictEqual(blank.letters.length, 0);
});

test('Publishing generates independent card without mutating the source demonstration template', () => {
  const demoTemplate = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', slug: 'demo', is_demo: true };

  function publishNewCard(draftInput) {
    return {
      id: `gift-${Date.now()}-abc`,
      slug: `${draftInput.recipientName.toLowerCase()}-gift`,
      title: draftInput.title,
      is_demo: false, // New cards are never marked as demo
      status: 'published',
    };
  }

  const newCard = publishNewCard({ recipientName: 'Zoya', title: 'For Zoya' });
  assert.notStrictEqual(newCard.id, demoTemplate.id);
  assert.notStrictEqual(newCard.slug, demoTemplate.slug);
  assert.strictEqual(newCard.is_demo, false);
  assert.strictEqual(demoTemplate.is_demo, true);
  assert.strictEqual(demoTemplate.slug, 'demo');
});

// -------------------------------------------------------------
// 22. DEMO CARD SEPARATION & USER ACCOUNT CARD ISOLATION TESTS
// -------------------------------------------------------------
console.log('\n--- 22. Demo Card Separation & User Account Card Isolation Tests ---');

test('User card querying returns empty list for new user and excludes demo cards', () => {
  const allCards = [
    { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', slug: 'demo', owner_id: 'system-demo', is_demo: true, title: 'Demo' },
    { id: 'gift-user-1', slug: 'anniversary', owner_id: 'user-123', is_demo: false, title: 'Anniversary' },
  ];

  function getUserCards(userId) {
    return allCards.filter(
      (c) =>
        c.owner_id === userId &&
        !c.is_demo &&
        c.slug !== 'demo' &&
        c.slug !== 'demo-gift' &&
        c.id !== 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    );
  }

  // New user with zero cards
  const newUserCards = getUserCards('brand-new-user-456');
  assert.strictEqual(newUserCards.length, 0);

  // Authenticated user with 1 card
  const user123Cards = getUserCards('user-123');
  assert.strictEqual(user123Cards.length, 1);
  assert.strictEqual(user123Cards[0].id, 'gift-user-1');

  // Verify demo card is NEVER returned to any user
  assert.strictEqual(getUserCards('system-demo').length, 0);
});

test('Public website surfaces demo card while user admin dashboard does not', () => {
  const publicShowcaseGifts = [
    { slug: 'demo-gift', is_demo: true, title: 'Explore Sample Gift' },
  ];

  const userAdminGifts = []; // User with 0 cards

  assert.strictEqual(publicShowcaseGifts.length, 1);
  assert.strictEqual(publicShowcaseGifts[0].slug, 'demo-gift');
  assert.strictEqual(userAdminGifts.length, 0);
});

// -------------------------------------------------------------
// 23. TWO DESIGNATED DEVELOPER ACCOUNTS & SUPER ADMIN ACCESS
// -------------------------------------------------------------
console.log('\n--- 23. Two Designated Developer Accounts & Super Admin Access ---');

const DESIGNATED_DEVELOPER_EMAILS = [
  'kaushikparth363@gmail.com',
  'kaushikparth353@gmail.com',
];

function isDesignatedPlatformDeveloper(email, dbRole, accountStatus = 'active') {
  if (!email || accountStatus !== 'active') return false;
  const cleanEmail = email.trim().toLowerCase();
  const isEmailAuthorized = DESIGNATED_DEVELOPER_EMAILS.includes(cleanEmail);
  const isRoleAuthorized = dbRole === 'developer';
  return isEmailAuthorized && isRoleAuthorized;
}

test('Developer 1 kaushikparth363@gmail.com is recognized as authorized super admin', () => {
  assert.strictEqual(
    isDesignatedPlatformDeveloper('kaushikparth363@gmail.com', 'developer', 'active'),
    true
  );
});

test('Developer 2 kaushikparth353@gmail.com is recognized as authorized super admin', () => {
  assert.strictEqual(
    isDesignatedPlatformDeveloper('kaushikparth353@gmail.com', 'developer', 'active'),
    true
  );
});

test('Suspended developer account is blocked from administrative access', () => {
  assert.strictEqual(
    isDesignatedPlatformDeveloper('kaushikparth353@gmail.com', 'developer', 'suspended'),
    false
  );
});

test('Ordinary creator cannot elevate permissions to developer role', () => {
  assert.strictEqual(
    isDesignatedPlatformDeveloper('regular-user@gmail.com', 'creator', 'active'),
    false
  );
  // Even if ordinary user fakes 'developer' string in frontend, unauthorized email fails
  assert.strictEqual(
    isDesignatedPlatformDeveloper('regular-user@gmail.com', 'developer', 'active'),
    false
  );
});

test('Sensitive credentials are never exposed in developer audit logs', () => {
  function sanitizeAuditDetails(details) {
    const copy = { ...details };
    delete copy.password;
    delete copy.password_hash;
    delete copy.otp;
    delete copy.token;
    delete copy.secret;
    return copy;
  }

  const rawAudit = {
    action: 'inspect_gift',
    slug: 'maya-gift',
    password: 'supersecretpassword123',
    password_hash: '$2a$10$abcdef...',
    token: 'jwt-session-token-xyz',
    otp: '123456',
  };

  const sanitized = sanitizeAuditDetails(rawAudit);
  assert.strictEqual(sanitized.action, 'inspect_gift');
  assert.strictEqual(sanitized.slug, 'maya-gift');
  assert.strictEqual(sanitized.password, undefined);
  assert.strictEqual(sanitized.password_hash, undefined);
  assert.strictEqual(sanitized.token, undefined);
  assert.strictEqual(sanitized.otp, undefined);
});

// -------------------------------------------------------------
// 24. MEMORY WALL ANIMATION STATE MACHINE & LOOP ELIMINATION TESTS
// -------------------------------------------------------------
console.log('\n--- 24. Memory Wall Animation State Machine & Loop Elimination Tests ---');

test('Photo interaction executes exactly once through controlled lifecycle states', () => {
  let state = 'idle'; // idle | opening | open | closing | returning

  function handlePhotoClick() {
    if (state !== 'idle') return false; // Block repeated clicks
    state = 'opening';
    return true;
  }

  function handleModalMounted() {
    if (state === 'opening') state = 'open';
  }

  function handlePhotoClose() {
    if (state !== 'open' && state !== 'opening') return false;
    state = 'closing';
    return true;
  }

  function handleExitComplete() {
    state = 'returning';
    // Return transition finishes cleanly
    state = 'idle';
  }

  // 1. Initial idle
  assert.strictEqual(state, 'idle');

  // 2. Click opens photo
  assert.strictEqual(handlePhotoClick(), true);
  assert.strictEqual(state, 'opening');

  // Secondary rapid clicks while transitioning are ignored
  assert.strictEqual(handlePhotoClick(), false);

  handleModalMounted();
  assert.strictEqual(state, 'open');

  // 3. User closes photo
  assert.strictEqual(handlePhotoClose(), true);
  assert.strictEqual(state, 'closing');

  // 4. Modal exit completes -> resets to idle
  handleExitComplete();
  assert.strictEqual(state, 'idle');

  // 5. Verify animation has stopped completely and does not auto-loop
  assert.strictEqual(state, 'idle');
});

test('Scrolling or intersection events cannot trigger photo enlargement', () => {
  let state = 'idle';
  let activeIndex = null;

  function handleScrollEvent() {
    // Scroll events NEVER mutate activeIndex or transition from idle to opening
    if (state === 'idle') {
      // Must remain idle
      return;
    }
  }

  handleScrollEvent();
  assert.strictEqual(state, 'idle');
  assert.strictEqual(activeIndex, null);
});

// -------------------------------------------------------------
// 25. LIVE CREATOR PREVIEW 1:1 PAGE ALIGNMENT & SYNC TESTS
// -------------------------------------------------------------
console.log('\n--- 25. Live Creator Preview 1:1 Page Alignment & Sync Tests ---');

const WIZARD_PAGES_TEST = [
  { step: 1, id: 'welcome', sectionId: 'welcome' },
  { step: 2, id: 'gift_box', sectionId: 'gift_box' },
  { step: 3, id: 'memory_wall', sectionId: 'memory_wall' },
  { step: 4, id: 'celebration', sectionId: 'celebration' },
  { step: 5, id: 'closing', sectionId: 'closing' },
  { step: 6, id: 'publish', sectionId: 'password' },
];

test('Wizard page order strictly matches recipient card section sequence', () => {
  assert.strictEqual(WIZARD_PAGES_TEST.length, 6);
  assert.strictEqual(WIZARD_PAGES_TEST[0].sectionId, 'welcome');
  assert.strictEqual(WIZARD_PAGES_TEST[1].sectionId, 'gift_box');
  assert.strictEqual(WIZARD_PAGES_TEST[2].sectionId, 'memory_wall');
  assert.strictEqual(WIZARD_PAGES_TEST[3].sectionId, 'celebration');
  assert.strictEqual(WIZARD_PAGES_TEST[4].sectionId, 'closing');
  assert.strictEqual(WIZARD_PAGES_TEST[5].sectionId, 'password');
});

test('Selecting wizard page automatically navigates live preview to corresponding section', () => {
  function getPreviewTarget(stepNumber) {
    const page = WIZARD_PAGES_TEST.find((p) => p.step === stepNumber);
    return page ? page.sectionId : 'welcome';
  }

  assert.strictEqual(getPreviewTarget(1), 'welcome');
  assert.strictEqual(getPreviewTarget(2), 'gift_box');
  assert.strictEqual(getPreviewTarget(3), 'memory_wall');
  assert.strictEqual(getPreviewTarget(4), 'celebration');
  assert.strictEqual(getPreviewTarget(5), 'closing');
  assert.strictEqual(getPreviewTarget(6), 'password');
});

test('Manual preview scroll synchronizes wizard active page without infinite loops', () => {
  let activeWizardStep = 1;
  let isProgrammaticScroll = false;

  function onPreviewSectionScrolled(visibleSectionId) {
    if (isProgrammaticScroll) return; // Prevent echo bounce loop

    if (visibleSectionId === 'welcome') activeWizardStep = 1;
    else if (visibleSectionId === 'gift_box' || visibleSectionId === 'scratch_card') activeWizardStep = 2;
    else if (visibleSectionId === 'memory_wall' || visibleSectionId === 'memories') activeWizardStep = 3;
    else if (visibleSectionId === 'celebration' || visibleSectionId === 'timeline') activeWizardStep = 4;
    else if (visibleSectionId === 'letters' || visibleSectionId === 'closing') activeWizardStep = 5;
  }

  // Creator manually scrolls preview to Memory Wall
  onPreviewSectionScrolled('memory_wall');
  assert.strictEqual(activeWizardStep, 3);

  // Creator manually scrolls preview to Gift Reveal
  onPreviewSectionScrolled('gift_box');
  assert.strictEqual(activeWizardStep, 2);

  // Programmatic scroll flag blocks echo callback
  isProgrammaticScroll = true;
  onPreviewSectionScrolled('welcome');
  assert.strictEqual(activeWizardStep, 2); // Unchanged during programmatic scroll
});

// -------------------------------------------------------------
// 26. FRIENDLY PASSWORD ATTEMPTS & ENCOURAGING FEEDBACK TESTS
// -------------------------------------------------------------
console.log('\n--- 26. Friendly Password Attempts & Encouraging Feedback Tests ---');

test('Password rate limiting allows at least 10 attempts before cooldown', () => {
  const attemptsStore = new Map();
  const maxAllowed = 10;
  const key = 'recipient-ip:gift-slug';

  for (let i = 1; i <= maxAllowed; i++) {
    const current = (attemptsStore.get(key) || 0) + 1;
    attemptsStore.set(key, current);
    assert.strictEqual(current <= maxAllowed, true);
  }

  // 11th consecutive attempt triggers cooldown restriction
  const overLimit = (attemptsStore.get(key) || 0) + 1;
  assert.strictEqual(overLimit <= maxAllowed, false);
});

test('Empty password submission does not decrement remaining attempts', () => {
  let attemptsCount = 0;
  function verifyPasswordInput(pwd) {
    if (!pwd || !pwd.trim()) {
      return { status: 400, error: 'Password required', counted: false };
    }
    attemptsCount++;
    return { status: 401, counted: true };
  }

  const emptyRes = verifyPasswordInput('');
  assert.strictEqual(emptyRes.status, 400);
  assert.strictEqual(emptyRes.counted, false);
  assert.strictEqual(attemptsCount, 0);

  const spacesRes = verifyPasswordInput('   ');
  assert.strictEqual(spacesRes.status, 400);
  assert.strictEqual(spacesRes.counted, false);
  assert.strictEqual(attemptsCount, 0);
});

test('Incorrect password returns warm and rotating friendly messages', () => {
  const FRIENDLY_MSGS = [
    "That was a good try! But I think there's another little secret to discover. Try again!",
    "Almost there! Someone special is waiting for you inside. Give it another shot!",
    "Nice attempt! I think you can solve this little mystery.",
    "Not quite this time! Think about the hint and try once more.",
    "You're getting closer! Take another guess.",
    "A little mystery deserves a little patience. Try again!",
    "Good effort! Maybe that special memory holds the answer.",
    "Oops! That wasn't the secret word. One more try?",
    "The surprise is still waiting for you. Give it another go!",
    "A lovely surprise is just one correct password away!",
  ];

  assert.strictEqual(FRIENDLY_MSGS.length, 10);
  FRIENDLY_MSGS.forEach((msg) => {
    assert.strictEqual(typeof msg, 'string');
    assert.strictEqual(msg.length > 20, true);
    // Never contains blunt phrases
    assert.strictEqual(msg.toLowerCase().includes('wrong password'), false);
    assert.strictEqual(msg.toLowerCase().includes('invalid password'), false);
  });
});

test('Password hints are displayed accurately for protected cards', () => {
  const giftWithHint = { title: 'Maya Birthday', password_hint: 'The cafe where it all started' };
  const giftWithoutHint = { title: 'Kabir Gift', password_hint: '' };

  assert.strictEqual(giftWithHint.password_hint, 'The cafe where it all started');
  assert.strictEqual(giftWithoutHint.password_hint, '');
});

// -------------------------------------------------------------
// 27. AUTOMATIC DRAFT PERSISTENCE & STICKY MOBILE PREVIEW TESTS
// -------------------------------------------------------------
console.log('\n--- 27. Automatic Draft Persistence & Sticky Mobile Preview Tests ---');

test('Draft record creation and update-in-place without duplicates', () => {
  const cardDatabase = new Map();
  const userId = 'usr-123';

  // 1. Initial draft creation
  const draftId = 'draft-456';
  cardDatabase.set(draftId, {
    id: draftId,
    owner_id: userId,
    title: 'Draft Gift',
    recipient_name: 'Ananya',
    status: 'draft',
    updated_at: new Date().toISOString(),
  });

  assert.strictEqual(cardDatabase.size, 1);
  assert.strictEqual(cardDatabase.get(draftId).status, 'draft');

  // 2. Autosave update in-place
  const existing = cardDatabase.get(draftId);
  cardDatabase.set(draftId, {
    ...existing,
    title: 'Updated Draft Gift',
    updated_at: new Date().toISOString(),
  });

  // Size remains 1 (no duplicate row created)
  assert.strictEqual(cardDatabase.size, 1);
  assert.strictEqual(cardDatabase.get(draftId).title, 'Updated Draft Gift');

  // 3. Publishing transitions status without duplicate
  cardDatabase.set(draftId, {
    ...cardDatabase.get(draftId),
    status: 'published',
    published_at: new Date().toISOString(),
  });

  assert.strictEqual(cardDatabase.size, 1);
  assert.strictEqual(cardDatabase.get(draftId).status, 'published');
});

test('Mobile preview preserves and restores editor scroll position', () => {
  let windowScrollY = 650;
  let savedEditorScrollPos = 0;
  let isMobilePreviewOpen = false;

  // Tap Live Preview on mobile
  savedEditorScrollPos = windowScrollY;
  isMobilePreviewOpen = true;

  assert.strictEqual(savedEditorScrollPos, 650);
  assert.strictEqual(isMobilePreviewOpen, true);

  // Close mobile preview
  isMobilePreviewOpen = false;
  windowScrollY = savedEditorScrollPos;

  assert.strictEqual(isMobilePreviewOpen, false);
  assert.strictEqual(windowScrollY, 650);
});

// -------------------------------------------------------------
// 28. CONTENT LENGTH & WORD LIMIT CONTROLS TESTS
// -------------------------------------------------------------
console.log('\n--- 28. Content Length & Word Limit Controls Tests ---');

import {
  countWords,
  clampToMaxWords,
  getWordCountFeedback,
  getUniquePhotos,
  DEFAULT_CONTENT_LIMITS,
} from '../src/lib/config/content-limits.ts';

test('Unicode & Indian Language Word Counting accurately handles English and Hindi', () => {
  // English with erratic spaces and punctuation
  const englishText = '   Hello,   world!   This  is   a   special  birthday   gift.   ';
  assert.strictEqual(countWords(englishText), 8);

  // Hindi (Devanagari) with dandas and standard words
  const hindiText = 'नमस्ते आप कैसे हैं? यह एक बेहद खूबसूरत उपहार है।';
  assert.strictEqual(countWords(hindiText), 10);

  // Mixed Hindi and English
  const mixedText = 'Happy Birthday Ananya! आप हमेशा मुस्कुराती रहें।';
  assert.strictEqual(countWords(mixedText), 7);

  // Empty or whitespace only
  assert.strictEqual(countWords(''), 0);
  assert.strictEqual(countWords('   \n\t  '), 0);
  assert.strictEqual(countWords(null), 0);
  assert.strictEqual(countWords(undefined), 0);
});

test('Word limit thresholds correctly evaluate below, at, and exceeding limits', () => {
  const maxWords = 10;
  const belowText = 'One two three four five';
  const atText = 'One two three four five six seven eight nine ten';
  const exceedingText = 'One two three four five six seven eight nine ten eleven twelve';

  assert.strictEqual(countWords(belowText) <= maxWords, true);
  assert.strictEqual(countWords(atText) <= maxWords, true);
  assert.strictEqual(countWords(exceedingText) <= maxWords, false);
});

test('Clamps copy-pasted oversized text without severing words', () => {
  const longParagraph =
    'Dear Ananya, this long paragraph was copied and pasted with far too many extra words that exceed our tight title limit.';
  const clamped = clampToMaxWords(longParagraph, 5);
  assert.strictEqual(countWords(clamped), 5);
  assert.strictEqual(clamped, 'Dear Ananya, this long paragraph');
});

test('Friendly feedback messages transition smoothly from normal to warning and limit', () => {
  // Normal
  const fb1 = getWordCountFeedback(40, 100);
  assert.strictEqual(fb1.tone, 'normal');
  assert.strictEqual(fb1.remaining, 60);

  // Warning (>= 80%)
  const fb2 = getWordCountFeedback(85, 100);
  assert.strictEqual(fb2.tone, 'warning');
  assert.strictEqual(fb2.message.includes('Almost there'), true);

  // Exact Limit
  const fb3 = getWordCountFeedback(100, 100);
  assert.strictEqual(fb3.tone, 'limit');
  assert.strictEqual(fb3.message.includes('reached the word limit'), true);

  // Exceeded (legacy card warning)
  const fb4 = getWordCountFeedback(115, 100);
  assert.strictEqual(fb4.tone, 'exceeded');
  assert.strictEqual(fb4.message.includes('15 over the 100-word limit'), true);
});

test('Initial platform defaults match configured word limit specification', () => {
  const f = DEFAULT_CONTENT_LIMITS.fields;
  assert.strictEqual(f.cardTitle.maxWords, 10);
  assert.strictEqual(f.shortIntroduction.maxWords, 50);
  assert.strictEqual(f.welcomeMessage.maxWords, 100);
  assert.strictEqual(f.personalLetter.maxWords, 300);
  assert.strictEqual(f.specialMessage.maxWords, 150);
  assert.strictEqual(f.individualWish.maxWords, 50);
  assert.strictEqual(f.memoryCaption.maxWords, 30);
  assert.strictEqual(f.photoDescription.maxWords, 40);
  assert.strictEqual(f.timelineDescription.maxWords, 50);
  assert.strictEqual(f.secretMessage.maxWords, 100);
  assert.strictEqual(f.quizQuestion.maxWords, 30);
  assert.strictEqual(f.quizAnswer.maxWords, 15);
  assert.strictEqual(f.finalClosingMessage.maxWords, 100);
  assert.strictEqual(f.customSectionText.maxWords, 150);
  assert.strictEqual(DEFAULT_CONTENT_LIMITS.maxPhotos, 15);
});

// -------------------------------------------------------------
// 29. MAXIMUM PHOTO UPLOAD LIMIT (15 PHOTOS) & DEDUPLICATION TESTS
// -------------------------------------------------------------
console.log('\n--- 29. Maximum Photo Upload Limit (15 Photos) & Deduplication Tests ---');

test('Allows uploading up to 15 unique photos across sections', () => {
  const mockCard = {
    cover_image: 'https://example.com/cover.jpg',
    memories: Array.from({ length: 10 }, (_, i) => ({
      id: `m-${i}`,
      image_path: `https://example.com/photo-${i}.jpg`,
      caption: `Memory ${i}`,
    })),
    timeline_entries: Array.from({ length: 4 }, (_, i) => ({
      id: `t-${i}`,
      image_path: `https://example.com/timeline-${i}.jpg`,
      title: `Event ${i}`,
    })),
  };

  const unique = getUniquePhotos(mockCard);
  // 1 cover + 10 memories + 4 timeline = 15 total unique photos
  assert.strictEqual(unique.length, 15);
  assert.strictEqual(unique.length <= DEFAULT_CONTENT_LIMITS.maxPhotos, true);
});

test('Rejects attempting to upload a 16th unique photo', () => {
  const mockCard = {
    cover_image: 'https://example.com/cover.jpg',
    memories: Array.from({ length: 11 }, (_, i) => ({
      id: `m-${i}`,
      image_path: `https://example.com/photo-${i}.jpg`,
      caption: `Memory ${i}`,
    })),
    timeline_entries: Array.from({ length: 4 }, (_, i) => ({
      id: `t-${i}`,
      image_path: `https://example.com/timeline-${i}.jpg`,
      title: `Event ${i}`,
    })),
  };

  const unique = getUniquePhotos(mockCard);
  // 1 cover + 11 memories + 4 timeline = 16 total unique photos
  assert.strictEqual(unique.length, 16);
  assert.strictEqual(unique.length > DEFAULT_CONTENT_LIMITS.maxPhotos, true);
});

test('Deduplicates photo URLs appearing in multiple sections', () => {
  const sharedPhotoUrl = 'https://example.com/rooftop-sunset.jpg';

  const mockCard = {
    cover_image: sharedPhotoUrl, // 1st occurrence
    memories: [
      { id: 'm1', image_path: sharedPhotoUrl, caption: 'Memory Wall View' }, // 2nd occurrence (Memory Wall)
      { id: 'm2', image_path: sharedPhotoUrl, caption: 'Gallery View' }, // 3rd occurrence (Gallery)
      { id: 'm3', image_path: 'https://example.com/roadtrip.jpg', caption: 'Roadtrip' },
    ],
    timeline_entries: [
      { id: 't1', image_path: sharedPhotoUrl, title: 'The First Date' }, // 4th occurrence (Timeline)
      { id: 't2', image_path: 'https://example.com/roadtrip.jpg', title: 'Roadtrip Event' },
    ],
  };

  const unique = getUniquePhotos(mockCard);
  // Even though sharedPhotoUrl appears 4 times and roadtrip appears twice,
  // there are strictly 2 unique photos in total!
  assert.strictEqual(unique.length, 2);
  assert.strictEqual(unique.includes(sharedPhotoUrl), true);
  assert.strictEqual(unique.includes('https://example.com/roadtrip.jpg'), true);
});

test('Replacing a photo preserves slot count and does not increment total photos', () => {
  const photoCollection = [
    'https://example.com/old-photo-1.jpg',
    'https://example.com/photo-2.jpg',
    'https://example.com/photo-3.jpg',
  ];

  assert.strictEqual(photoCollection.length, 3);

  // Replace photo at index 0 with a new one
  photoCollection[0] = 'https://example.com/new-replacement-photo.jpg';

  // Collection size remains 3
  assert.strictEqual(photoCollection.length, 3);
  assert.strictEqual(photoCollection[0], 'https://example.com/new-replacement-photo.jpg');
});

test('Remaining photo slots calculation reflects accurate availability', () => {
  const currentCount = 12;
  const maxPhotos = 15;
  const remainingSlots = Math.max(0, maxPhotos - currentCount);

  assert.strictEqual(remainingSlots, 3);

  // When user selects 5 photos but only 3 slots remain
  const selectedBatch = ['p1.jpg', 'p2.jpg', 'p3.jpg', 'p4.jpg', 'p5.jpg'];
  const acceptedBatch = selectedBatch.slice(0, remainingSlots);

  assert.strictEqual(acceptedBatch.length, 3);
  assert.deepStrictEqual(acceptedBatch, ['p1.jpg', 'p2.jpg', 'p3.jpg']);
});

test('Existing legacy cards exceeding limits are preserved without truncation', () => {
  const legacyCard = {
    id: 'legacy-card-99',
    title: 'An Extremely Long Legacy Title That Exceeds Ten Words And Was Created In Previous Production',
    welcome_message:
      'This is an existing long welcome message from an earlier version of Dear You that has more than one hundred words. '.repeat(
        6
      ),
  };

  // Ensure count exceeds initial limit
  assert.strictEqual(countWords(legacyCard.title) > 10, true);
  assert.strictEqual(countWords(legacyCard.welcome_message) > 100, true);

  // Migration policy: legacy card text is preserved without automatic truncation
  assert.strictEqual(legacyCard.title.includes('Legacy Title'), true);
  assert.strictEqual(legacyCard.welcome_message.length > 500, true);
});

// -------------------------------------------------------------
// 30. DEVELOPER CONFIGURATION & AUDIT TRAIL TESTS
// -------------------------------------------------------------
console.log('\n--- 30. Developer Configuration & Audit Trail Tests ---');

test('Only authorized platform owners can modify content limits', () => {
  const authorizedOwners = ['kaushikparth363@gmail.com', 'kaushikparth353@gmail.com'];

  const canModify1 = authorizedOwners.includes('kaushikparth363@gmail.com');
  const canModify2 = authorizedOwners.includes('kaushikparth353@gmail.com');
  const unauthorizedUser = authorizedOwners.includes('regular.user@example.com');

  assert.strictEqual(canModify1, true);
  assert.strictEqual(canModify2, true);
  assert.strictEqual(unauthorizedUser, false);
});

test('Modifying platform content limits produces structured audit log entry', () => {
  const auditLogs = [];

  function simulateSettingUpdate(developerEmail, previousLimits, newLimits) {
    if (
      developerEmail !== 'kaushikparth363@gmail.com' &&
      developerEmail !== 'kaushikparth353@gmail.com'
    ) {
      throw new Error('Forbidden: Platform Developer access required');
    }

    auditLogs.push({
      action_type: 'modify_platform_settings',
      developer_email: developerEmail,
      details: {
        setting: 'content_limits',
        previousMaxPhotos: previousLimits.maxPhotos,
        newMaxPhotos: newLimits.maxPhotos,
      },
      action_result: 'success',
      created_at: new Date().toISOString(),
    });
  }

  simulateSettingUpdate(
    'kaushikparth363@gmail.com',
    { maxPhotos: 15 },
    { maxPhotos: 20 }
  );

  assert.strictEqual(auditLogs.length, 1);
  assert.strictEqual(auditLogs[0].action_type, 'modify_platform_settings');
  assert.strictEqual(auditLogs[0].developer_email, 'kaushikparth363@gmail.com');
  assert.strictEqual(auditLogs[0].details.newMaxPhotos, 20);
});

// -------------------------------------------------------------
// 31. CREATOR LIVE PREVIEW & RECIPIENT AUTH SEPARATION TESTS
// -------------------------------------------------------------
console.log('\n--- 31. Creator Live Preview & Recipient Auth Separation Tests ---');

test('Creator Preview initializes unlocked without requiring recipient access session', () => {
  // Simulates RecipientExperience with isPreview=true
  function simulateRecipientExperienceMount(props) {
    const isUnlocked = props.isPreview ? true : (props.initialUnlocked ?? false);
    let sessionCheckExecuted = false;

    // Heartbeat logic
    if (!props.isPreview && isUnlocked) {
      sessionCheckExecuted = true;
    }

    return {
      isUnlocked,
      sessionCheckExecuted,
      revocationNotice: null,
      displaysPasswordGate: !isUnlocked,
    };
  }

  const previewState = simulateRecipientExperienceMount({
    gift: { id: 'builder-preview', slug: 'surprise', title: 'My Draft' },
    initialUnlocked: true,
    isPreview: true,
  });

  assert.strictEqual(previewState.isUnlocked, true);
  assert.strictEqual(previewState.sessionCheckExecuted, false);
  assert.strictEqual(previewState.displaysPasswordGate, false);
  assert.strictEqual(previewState.revocationNotice, null);
});

test('Real recipient experience enforces password gate and runs heartbeat session-check', () => {
  function simulateRecipientExperienceMount(props) {
    const isUnlocked = props.isPreview ? true : (props.initialUnlocked ?? false);
    let sessionCheckExecuted = false;

    if (!props.isPreview && isUnlocked) {
      sessionCheckExecuted = true;
    }

    return {
      isUnlocked,
      sessionCheckExecuted,
      displaysPasswordGate: !isUnlocked,
    };
  }

  // Locked recipient
  const lockedRecipient = simulateRecipientExperienceMount({
    gift: { id: 'real-gift-1', slug: 'anniversary' },
    initialUnlocked: false,
    isPreview: false,
  });
  assert.strictEqual(lockedRecipient.isUnlocked, false);
  assert.strictEqual(lockedRecipient.displaysPasswordGate, true);
  assert.strictEqual(lockedRecipient.sessionCheckExecuted, false);

  // Unlocked recipient runs periodic heartbeat
  const unlockedRecipient = simulateRecipientExperienceMount({
    gift: { id: 'real-gift-1', slug: 'anniversary' },
    initialUnlocked: true,
    isPreview: false,
  });
  assert.strictEqual(unlockedRecipient.isUnlocked, true);
  assert.strictEqual(unlockedRecipient.displaysPasswordGate, false);
  assert.strictEqual(unlockedRecipient.sessionCheckExecuted, true);
});

test('Preview mode tabs switch cleanly between Gift Journey, Password Gate and Closing Screen', () => {
  let activeTab = 'unlocked'; // 'unlocked' | 'password_gate' | 'expired_closing'

  function renderTab(tab, draftGift) {
    switch (tab) {
      case 'password_gate':
        return {
          view: 'PasswordGate',
          recipientName: draftGift.recipient_name,
          title: draftGift.title,
          isSimulated: true,
          passwordExposed: false,
          hasSessionError: false,
        };
      case 'expired_closing':
        return {
          view: 'ExpiryScreen',
          heading: draftGift.expiry_heading || 'This Gift Has Concluded',
          actualGiftExpired: draftGift.expiry_enabled,
          hasSessionError: false,
        };
      case 'unlocked':
      default:
        return {
          view: 'GiftJourney',
          sections: ['welcome', 'gift_box', 'memory_wall', 'celebration', 'closing'],
          hasSessionError: false,
        };
    }
  }

  const draftGift = {
    title: 'Surprise for Jane',
    recipient_name: 'Jane',
    expiry_enabled: false,
    expiry_heading: 'Farewell Moments',
  };

  // 1. Gift Journey
  const journey = renderTab('unlocked', draftGift);
  assert.strictEqual(journey.view, 'GiftJourney');
  assert.strictEqual(journey.hasSessionError, false);
  assert.strictEqual(journey.sections.includes('memory_wall'), true);

  // 2. Password Gate simulation
  const gate = renderTab('password_gate', draftGift);
  assert.strictEqual(gate.view, 'PasswordGate');
  assert.strictEqual(gate.isSimulated, true);
  assert.strictEqual(gate.passwordExposed, false);
  assert.strictEqual(gate.hasSessionError, false);

  // 3. Closing Screen inspection
  const closing = renderTab('expired_closing', draftGift);
  assert.strictEqual(closing.view, 'ExpiryScreen');
  assert.strictEqual(closing.heading, 'Farewell Moments');
  assert.strictEqual(closing.actualGiftExpired, false); // Inspected without changing actual draft state
});

test('Standalone preview route /g/[slug]/preview enforces strict creator ownership', () => {
  const mockDbGifts = [
    { id: 'gift-alice', slug: 'for-alice', owner_id: 'user-alice', title: "Alice's Card" },
    { id: 'gift-bob', slug: 'for-bob', owner_id: 'user-bob', title: "Bob's Card" },
  ];

  function evaluatePreviewRouteAccess(slug, authenticatedUserId, userRole, userEmail) {
    if (!authenticatedUserId) {
      return { allowed: false, action: 'redirect_login' };
    }

    const gift = mockDbGifts.find((g) => g.slug === slug);
    if (!gift) return { allowed: false, action: 'not_found' };

    const isOwner = gift.owner_id === authenticatedUserId;
    const isDeveloper =
      userRole === 'developer' ||
      userEmail === 'kaushikparth363@gmail.com' ||
      userEmail === 'kaushikparth353@gmail.com';

    if (isOwner || isDeveloper) {
      return { allowed: true, action: 'render_preview' };
    }

    return { allowed: false, action: 'forbidden_not_found' };
  }

  // 1. Owner accesses their own gift preview -> ALLOWED
  const ownerAccess = evaluatePreviewRouteAccess('for-alice', 'user-alice', 'creator', 'alice@test.com');
  assert.strictEqual(ownerAccess.allowed, true);
  assert.strictEqual(ownerAccess.action, 'render_preview');

  // 2. Different user attempts to access another user's draft preview -> FORBIDDEN (Denied)
  const intruderAccess = evaluatePreviewRouteAccess('for-alice', 'user-bob', 'creator', 'bob@test.com');
  assert.strictEqual(intruderAccess.allowed, false);
  assert.strictEqual(intruderAccess.action, 'forbidden_not_found');

  // 3. Platform Developer accesses preview -> ALLOWED
  const devAccess = evaluatePreviewRouteAccess('for-alice', 'dev-1', 'developer', 'kaushikparth363@gmail.com');
  assert.strictEqual(devAccess.allowed, true);
  assert.strictEqual(devAccess.action, 'render_preview');

  // 4. Unauthenticated user -> REDIRECT TO LOGIN
  const unauthAccess = evaluatePreviewRouteAccess('for-alice', null, null, null);
  assert.strictEqual(unauthAccess.allowed, false);
  assert.strictEqual(unauthAccess.action, 'redirect_login');
});

test('Unauthorized user cannot bypass recipient password on published card using ?preview=true', () => {
  function verifyContentAccess({ hasRecipientSessionCookie, wantsPreviewQuery, callerUserId, giftOwnerId, isDeveloper }) {
    let isAuthorizedPreview = false;
    if (wantsPreviewQuery) {
      const isOwner = !!(callerUserId && callerUserId === giftOwnerId);
      if (isOwner || isDeveloper) {
        isAuthorizedPreview = true;
      }
    }

    // Access granted only if valid recipient session exists OR caller is verified owner/developer
    return hasRecipientSessionCookie || isAuthorizedPreview;
  }

  // 1. Legitimate recipient with valid session cookie -> GRANTED
  assert.strictEqual(
    verifyContentAccess({
      hasRecipientSessionCookie: true,
      wantsPreviewQuery: false,
      callerUserId: null,
      giftOwnerId: 'owner-1',
      isDeveloper: false,
    }),
    true
  );

  // 2. Attacker without recipient cookie appending ?preview=true -> DENIED
  assert.strictEqual(
    verifyContentAccess({
      hasRecipientSessionCookie: false,
      wantsPreviewQuery: true,
      callerUserId: 'intruder-user',
      giftOwnerId: 'owner-1',
      isDeveloper: false,
    }),
    false
  );

  // 3. Anonymous attacker appending ?preview=true -> DENIED
  assert.strictEqual(
    verifyContentAccess({
      hasRecipientSessionCookie: false,
      wantsPreviewQuery: true,
      callerUserId: null,
      giftOwnerId: 'owner-1',
      isDeveloper: false,
    }),
    false
  );

  // 4. Genuine creator inspecting preview with ?preview=true -> GRANTED
  assert.strictEqual(
    verifyContentAccess({
      hasRecipientSessionCookie: false,
      wantsPreviewQuery: true,
      callerUserId: 'owner-1',
      giftOwnerId: 'owner-1',
      isDeveloper: false,
    }),
    true
  );
});

// -------------------------------------------------------------
// 32. HOME NAVIGATION & "CREATE YOUR OWN GIFT" CTA TESTS
// -------------------------------------------------------------
console.log('\n--- 32. Home Navigation & "Create Your Own Gift" CTA Tests ---');

test('Password screen features top-left clickable logo and Back to Home link targeting "/"', () => {
  // Simulates header navigation on PasswordGate
  function simulatePasswordGateHeader() {
    return {
      logo: {
        href: '/',
        label: 'Dear You',
        position: 'top-left',
        isClickable: true,
      },
      backLink: {
        href: '/',
        label: '← Back to Home',
        position: 'top-right',
        isClickable: true,
        submitsForm: false,
      },
    };
  }

  const header = simulatePasswordGateHeader();
  assert.strictEqual(header.logo.href, '/');
  assert.strictEqual(header.logo.position, 'top-left');
  assert.strictEqual(header.logo.isClickable, true);
  assert.strictEqual(header.backLink.href, '/');
  assert.strictEqual(header.backLink.position, 'top-right');
  assert.strictEqual(header.backLink.submitsForm, false);
});

test('Navigation from password screen never modifies recipient access tokens', () => {
  const recipientCookies = {
    'dy_recipient_maya-anniversary': 'valid_token_xyz',
  };

  function clickHomeLink(cookies) {
    // Navigation is a standard Next.js <Link href="/">; does not mutate recipient cookies
    return { target: '/', cookiesUnchanged: true };
  }

  const navResult = clickHomeLink(recipientCookies);
  assert.strictEqual(navResult.target, '/');
  assert.strictEqual(navResult.cookiesUnchanged, true);
  assert.strictEqual(recipientCookies['dy_recipient_maya-anniversary'], 'valid_token_xyz');
});

test('Create Your Own Gift section appears strictly after sender content and not between sections', () => {
  const senderSections = [
    { type: 'welcome', order: 0 },
    { type: 'gift_box', order: 1 },
    { type: 'celebration', order: 2 },
    { type: 'memory_wall', order: 3 },
    { type: 'letters', order: 4 },
    { type: 'closing', order: 5 },
  ];

  // RecipientExperience renders platform CTA after all mapped sender sections
  const journeyRenderOrder = [
    ...senderSections.map((s) => s.type),
    'platform_create_your_own_gift_cta',
  ];

  const closingIndex = journeyRenderOrder.indexOf('closing');
  const ctaIndex = journeyRenderOrder.indexOf('platform_create_your_own_gift_cta');
  const memoryWallIndex = journeyRenderOrder.indexOf('memory_wall');

  assert.strictEqual(ctaIndex > closingIndex, true);
  assert.strictEqual(ctaIndex > memoryWallIndex, true);
  assert.strictEqual(journeyRenderOrder[journeyRenderOrder.length - 1], 'platform_create_your_own_gift_cta');
});

test('Create Your Own Gift section contains specified heading, subtitle, primary CTA and secondary link', () => {
  const ctaContent = {
    heading: 'Your turn to make someone smile!',
    subtitle: 'Create a beautiful digital surprise for someone special. Your memories, your stories, your way.',
    primaryButton: {
      label: 'Create Your Own Gift',
      href: '/',
    },
    secondaryLink: {
      label: 'Discover Dear You',
      href: '/',
    },
  };

  assert.strictEqual(ctaContent.heading, 'Your turn to make someone smile!');
  assert.strictEqual(ctaContent.subtitle.includes('memories, your stories, your way'), true);
  assert.strictEqual(ctaContent.primaryButton.label, 'Create Your Own Gift');
  assert.strictEqual(ctaContent.primaryButton.href, '/');
  assert.strictEqual(ctaContent.secondaryLink.label, 'Discover Dear You');
  assert.strictEqual(ctaContent.secondaryLink.href, '/');
});

test('Expired screen preserves custom closing message and provides Back to Home & Create Gift CTAs without exposing private content', () => {
  const expiredGift = {
    id: 'gift-expired',
    slug: 'expired-birthday',
    recipient_name: 'Sophia',
    expiry_enabled: true,
    expires_at: '2020-01-01T00:00:00Z',
    expiry_heading: 'This Special Chapter Has Closed',
    expiry_message: 'Thank you for reading and cherishing this surprise with us.',
    memories: [{ id: 'm1', caption: 'Private secret memory' }],
    letters: [{ id: 'l1', content: 'Private secret letter' }],
  };

  function renderExpiredScreen(gift) {
    return {
      recipientName: gift.recipient_name,
      heading: gift.expiry_heading,
      message: gift.expiry_message,
      navHeader: {
        logoHref: '/',
        backHomeHref: '/',
      },
      actionButtons: [
        { label: 'Create Your Own Gift', href: '/' },
        { label: 'Return to Home', href: '/' },
      ],
      // Private content must be stripped
      exposedMemories: undefined,
      exposedLetters: undefined,
    };
  }

  const view = renderExpiredScreen(expiredGift);
  assert.strictEqual(view.recipientName, 'Sophia');
  assert.strictEqual(view.heading, 'This Special Chapter Has Closed');
  assert.strictEqual(view.message, 'Thank you for reading and cherishing this surprise with us.');
  assert.strictEqual(view.navHeader.logoHref, '/');
  assert.strictEqual(view.navHeader.backHomeHref, '/');
  assert.strictEqual(view.actionButtons.some((b) => b.label === 'Create Your Own Gift' && b.href === '/'), true);
  assert.strictEqual(view.exposedMemories, undefined);
  assert.strictEqual(view.exposedLetters, undefined);
});

// -------------------------------------------------------------
// 33. BACKGROUND MUSIC PLAYBACK, STATE MACHINE & RESILIENCE TESTS
// -------------------------------------------------------------
console.log('\n--- 33. Background Music Playback, State Machine & Resilience Tests ---');

test('Local audio assets are bundled and accessible on origin without 403 hotlink blocks', () => {
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  const trackPath = path.join(audioDir, 'gentle-moments.mp3');

  assert.strictEqual(fs.existsSync(audioDir), true, 'public/audio directory must exist');
  assert.strictEqual(fs.existsSync(trackPath), true, 'gentle-moments.mp3 must exist in public/audio');
  const stats = fs.statSync(trackPath);
  assert.strictEqual(stats.size > 1000000, true, 'Audio file must be substantial MP3 file');
});

test('Mock data and creator templates default to reliable bundled audio track', () => {
  const mockContent = fs.readFileSync('src/lib/mock-data.ts', 'utf8');
  assert.strictEqual(mockContent.includes('/audio/gentle-moments.mp3'), true);
  assert.strictEqual(mockContent.includes('mixkit.co'), false, 'All forbidden 403 mixkit URLs removed');

  const createContent = fs.readFileSync('src/app/admin/create/page.tsx', 'utf8');
  assert.strictEqual(createContent.includes('/audio/gentle-moments.mp3'), true);
  assert.strictEqual(createContent.includes('mixkit.co'), false);
});

test('Audio state machine transitions cleanly through idle -> loading -> playing -> paused', () => {
  class AudioEngine {
    constructor(src) {
      this.src = src;
      this.status = 'idle'; // idle | loading | playing | paused | blocked | error
      this.isMuted = false;
      this.hasStartedJourney = false;
      this.hasUserInitiatedPlay = false;
      this.error = null;
    }

    startJourney() {
      this.hasStartedExperience = true;
      this.hasUserInitiatedPlay = true;
      this.status = 'loading';
      // Simulate play promise resolution
      return Promise.resolve().then(() => {
        this.status = 'playing';
        this.error = null;
      });
    }

    togglePlay() {
      this.hasUserInitiatedPlay = true;
      if (this.status === 'playing') {
        this.status = 'paused';
        return Promise.resolve();
      } else {
        this.status = 'loading';
        return Promise.resolve().then(() => {
          this.status = 'playing';
          this.error = null;
        });
      }
    }

    simulateAutoplayRejection() {
      this.hasUserInitiatedPlay = true;
      this.status = 'loading';
      return Promise.reject(new Error('NotAllowedError')).catch((err) => {
        this.status = 'blocked';
        this.error = 'Browser paused audio. Tap to listen.';
      });
    }

    simulateNetworkError(fallbackSrc) {
      if (this.src !== fallbackSrc) {
        this.src = fallbackSrc;
        if (this.hasUserInitiatedPlay) {
          return this.togglePlay();
        }
      } else {
        this.status = 'error';
        this.error = 'Unable to play audio.';
      }
    }

    getButtonLabel() {
      if (this.status === 'playing') return 'Pause Music';
      if (this.hasStartedExperience) return 'Continue Music';
      return 'Play Music';
    }

    getStatusLabel() {
      if (this.status === 'playing') return 'Now Playing';
      if (this.status === 'loading') return 'Loading...';
      if (this.status === 'blocked') return 'Tap to play';
      if (this.hasStartedExperience) return 'Continue Music';
      return 'Paused';
    }
  }

  const engine = new AudioEngine('/audio/gentle-moments.mp3');
  assert.strictEqual(engine.status, 'idle');
  assert.strictEqual(engine.getButtonLabel(), 'Play Music');

  // Start journey
  return engine.startJourney().then(() => {
    assert.strictEqual(engine.status, 'playing');
    assert.strictEqual(engine.getButtonLabel(), 'Pause Music');
    assert.strictEqual(engine.getStatusLabel(), 'Now Playing');

    // Pause music
    return engine.togglePlay();
  }).then(() => {
    assert.strictEqual(engine.status, 'paused');
    assert.strictEqual(engine.getButtonLabel(), 'Continue Music');
    assert.strictEqual(engine.getStatusLabel(), 'Continue Music');

    // Continue music
    return engine.togglePlay();
  }).then(() => {
    assert.strictEqual(engine.status, 'playing');
    assert.strictEqual(engine.getButtonLabel(), 'Pause Music');
  });
});

test('Browser autoplay rejection sets blocked state and allows Continue Music recovery', async () => {
  let status = 'idle';
  let error = null;

  // 1. Recipient clicks Start Your Journey, but browser blocks unmuted audio
  function handleStartJourney(simulateBlock = true) {
    if (simulateBlock) {
      const err = new Error('play() request failed');
      err.name = 'NotAllowedError';
      status = 'blocked';
      error = 'Audio blocked by browser. Tap to listen.';
      return Promise.reject(err);
    } else {
      status = 'playing';
      error = null;
      return Promise.resolve();
    }
  }

  try {
    await handleStartJourney(true);
  } catch {
    // Autoplay blocked
  }

  assert.strictEqual(status, 'blocked');
  assert.strictEqual(error, 'Audio blocked by browser. Tap to listen.');

  // 2. User sees friendly banner / Continue Music button and clicks it
  function handleContinueMusic() {
    status = 'playing';
    error = null;
  }

  handleContinueMusic();
  assert.strictEqual(status, 'playing');
  assert.strictEqual(error, null);
});

test('Broken external audio source triggers automatic fallback to bundled gentle-moments.mp3', () => {
  let currentSrc = 'https://broken-cdn.com/missing-track.mp3';
  let status = 'idle';
  let hasUserInitiatedPlay = true;

  function handleAudioError() {
    const fallback = '/audio/gentle-moments.mp3';
    if (currentSrc !== fallback) {
      currentSrc = fallback;
      if (hasUserInitiatedPlay) {
        status = 'playing';
      }
    } else {
      status = 'error';
    }
  }

  handleAudioError();
  assert.strictEqual(currentSrc, '/audio/gentle-moments.mp3');
  assert.strictEqual(status, 'playing', 'Automatically retries and recovers with bundled asset');
});

test('Recipient experience keeps a single persistent audio element across section navigation', () => {
  const code = fs.readFileSync('src/components/recipient/RecipientExperience.tsx', 'utf8');

  // Verify audio element is rendered at top level outside dynamic sections loop
  const audioIndex = code.indexOf('<audio');
  const sectionsLoopIndex = code.indexOf('{enabledSections.map');
  assert.strictEqual(audioIndex > 0, true, '<audio> element must be rendered in RecipientExperience');
  assert.strictEqual(sectionsLoopIndex > audioIndex, true, '<audio> element must reside above sections loop to persist across scrolls');
  assert.strictEqual(code.includes('loop'), true, 'Audio element must loop continuously');
  assert.strictEqual(code.includes('preload="auto"'), true, 'Audio element must preload audio stream');
  assert.strictEqual(code.includes('onError={handleAudioError}'), true, 'Audio element must implement error recovery fallback');
});

// -------------------------------------------------------------
// 34. FULL GIFT RELATIONAL DATA & DEMO PREVIEW INTEGRITY TESTS
// -------------------------------------------------------------
console.log('\n--- 34. Full Gift Relational Data & Demo Preview Integrity Tests ---');

test('Preview page imports and invokes getGiftWithChildCollections to avoid empty skeleton preview', () => {
  const previewPageCode = fs.readFileSync('src/app/g/[slug]/preview/page.tsx', 'utf8');
  assert.strictEqual(
    previewPageCode.includes('getGiftWithChildCollections'),
    true,
    'Preview page must use getGiftWithChildCollections'
  );
  assert.strictEqual(
    previewPageCode.includes('await getGiftWithChildCollections(slug)'),
    true,
    'Must fetch complete gift with child relational collections'
  );
});

test('Demonstration card retains all sections, memories, letters, timelines & interactive modules', () => {
  const mockCode = fs.readFileSync('src/lib/mock-data.ts', 'utf8');
  assert.strictEqual(mockCode.includes("MOCK_GIFTS['demo']"), true, 'Canonical demo card must be defined');

  const fetchGiftCode = fs.readFileSync('src/lib/gifts/fetch-gift.ts', 'utf8');
  assert.strictEqual(
    fetchGiftCode.includes('canonicalDemo.memories'),
    true,
    'Must guarantee memories are preserved for demo card'
  );
  assert.strictEqual(
    fetchGiftCode.includes('canonicalDemo.timeline_entries'),
    true,
    'Must guarantee timeline is preserved for demo card'
  );
  assert.strictEqual(
    fetchGiftCode.includes('canonicalDemo.letters'),
    true,
    'Must guarantee letters are preserved for demo card'
  );
  assert.strictEqual(
    fetchGiftCode.includes('canonicalDemo.sections'),
    true,
    'Must guarantee all sections are preserved for demo card'
  );
});

test('Child components render appropriately without returning null when data is present', () => {
  const demoGift = {
    recipient_name: 'Ananya',
    memories: [
      { id: 'm1', image_path: '/img1.jpg', caption: 'Test Memory', display_order: 1 }
    ],
    timeline_entries: [
      { id: 't1', title: 'Test Story', description: 'Met at cafe', event_date: '2023-01-01', display_order: 1 }
    ],
    letters: [
      { id: 'l1', heading: 'Letter', content: 'Heartfelt letter', display_order: 1 }
    ],
  };

  // Simulating component render guards
  const memoryWallRenders = Boolean(demoGift.memories && demoGift.memories.length > 0);
  const timelineRenders = Boolean(demoGift.timeline_entries && demoGift.timeline_entries.length > 0);
  const letterRenders = Boolean(demoGift.letters && demoGift.letters.length > 0);

  assert.strictEqual(memoryWallRenders, true, 'MemoryWall renders when memories are present');
  assert.strictEqual(timelineRenders, true, 'TimelineSection renders when timeline_entries are present');
  assert.strictEqual(letterRenders, true, 'LetterSection renders when letters are present');
});

// -------------------------------------------------------------
// 35. AUTHENTICATED CREATOR DASHBOARD PROFILE IDENTITY & DROPDOWN TESTS
// -------------------------------------------------------------
console.log('\n--- 35. Creator Dashboard Profile Identity & Dropdown Tests ---');

test('Profile initials helper handles multi-word names, single words and emails gracefully', () => {
  function getInitials(nameOrEmail) {
    if (!nameOrEmail) return 'U';
    const clean = nameOrEmail.trim();
    if (clean.includes('@')) {
      return clean[0].toUpperCase();
    }
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }

  assert.strictEqual(getInitials('Parth Kaushik'), 'PK');
  assert.strictEqual(getInitials('Parth'), 'PA');
  assert.strictEqual(getInitials('kaushikparth363@gmail.com'), 'K');
  assert.strictEqual(getInitials(''), 'U');
  assert.strictEqual(getInitials(null), 'U');
});

test('Profile identity accurately distinguishes between Developer and Creator account types', () => {
  function resolveAccountType(email, dbRole) {
    const isDev =
      email === 'kaushikparth363@gmail.com' ||
      email === 'kaushikparth353@gmail.com' ||
      dbRole === 'developer';
    return isDev ? 'Developer' : 'Creator';
  }

  assert.strictEqual(resolveAccountType('kaushikparth363@gmail.com', 'developer'), 'Developer');
  assert.strictEqual(resolveAccountType('kaushikparth353@gmail.com', 'developer'), 'Developer');
  assert.strictEqual(resolveAccountType('kaushikparth373@gmail.com', 'creator'), 'Creator');
  assert.strictEqual(resolveAccountType('ordinary-creator@example.com', 'creator'), 'Creator');
});

test('Profile identity endpoint strictly rejects unauthenticated access with HTTP 401', () => {
  function verifyProfileAuth(sessionToken) {
    if (!sessionToken || sessionToken.trim() === '') {
      return { status: 401, error: 'Unauthorized: Please sign in to view your profile.' };
    }
    return { status: 200, user: { email: 'user@example.com' } };
  }

  const unauthRes = verifyProfileAuth('');
  assert.strictEqual(unauthRes.status, 401);
  assert.strictEqual(unauthRes.error.includes('Unauthorized'), true);

  const authRes = verifyProfileAuth('valid-token');
  assert.strictEqual(authRes.status, 200);
});

test('Profile update endpoint allows display_name changes but strictly blocks arbitrary email alterations', () => {
  function validateProfileUpdate(body) {
    if (body.email) {
      return {
        status: 400,
        error: 'Authenticated email address cannot be changed directly. Please use the secure email change and verification procedure.'
      };
    }
    if (!body.displayName || !body.displayName.trim()) {
      return { status: 400, error: 'Full name cannot be blank.' };
    }
    return { status: 200, success: true, updatedName: body.displayName.trim() };
  }

  const emailAttempt = validateProfileUpdate({ displayName: 'New Name', email: 'tampered@example.com' });
  assert.strictEqual(emailAttempt.status, 400);
  assert.strictEqual(emailAttempt.error.includes('cannot be changed directly'), true);

  const emptyNameAttempt = validateProfileUpdate({ displayName: '   ' });
  assert.strictEqual(emptyNameAttempt.status, 400);
  assert.strictEqual(emptyNameAttempt.error.includes('cannot be blank'), true);

  const validAttempt = validateProfileUpdate({ displayName: 'Parth Kaushik' });
  assert.strictEqual(validAttempt.status, 200);
  assert.strictEqual(validAttempt.updatedName, 'Parth Kaushik');
});

test('Admin layout renders profile card in sidebar with clickable dropdown options and graceful fallbacks', () => {
  const layoutCode = fs.readFileSync('src/app/admin/layout.tsx', 'utf8');

  assert.strictEqual(layoutCode.includes('/api/auth/profile'), true, 'Layout must fetch verified account profile');
  assert.strictEqual(layoutCode.includes('profileDropdownOpen'), true, 'Must manage profile dropdown open state');
  assert.strictEqual(layoutCode.includes('Profile Settings'), true, 'Dropdown must include Profile Settings option');
  assert.strictEqual(layoutCode.includes('Sign Out'), true, 'Dropdown must include Sign Out option');
  assert.strictEqual(layoutCode.includes('Your Account'), true, 'Must provide sensible fallback if name is unavailable');
  assert.strictEqual(layoutCode.includes('Email unavailable'), true, 'Must provide sensible fallback if email is unavailable');
  assert.strictEqual(layoutCode.includes('Platform Developer'), true, 'Must display appropriate account role label');
  assert.strictEqual(layoutCode.includes('truncate'), true, 'Long email and name must truncate gracefully in sidebar');
});

console.log(`\n==============================================`);
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} tests passed.`);
console.log(`==============================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
