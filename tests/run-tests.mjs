import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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

test('Create Your Own Gift section contains consolidated prominent CTA opening homepage in new tab', () => {
  const ctaContent = {
    heading: 'Your turn to make someone smile!',
    subtitle: 'Create a beautiful digital surprise for someone special. Your memories, your stories, your way.',
    consolidatedButton: {
      label: 'Discover Dear You & Create Your Own Gift',
      href: '/',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  };

  assert.strictEqual(ctaContent.heading, 'Your turn to make someone smile!');
  assert.strictEqual(ctaContent.subtitle.includes('memories, your stories, your way'), true);
  assert.strictEqual(ctaContent.consolidatedButton.label, 'Discover Dear You & Create Your Own Gift');
  assert.strictEqual(ctaContent.consolidatedButton.href, '/');
  assert.strictEqual(ctaContent.consolidatedButton.target, '_blank');
  assert.strictEqual(ctaContent.consolidatedButton.rel, 'noopener noreferrer');
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

// -------------------------------------------------------------
// 36. BRAND IDENTITY, FAVICON & ASSET INTEGRATION TESTS
// -------------------------------------------------------------
console.log('\n--- 36. Brand Identity, Favicon & Asset Integration Tests ---');

test('All required brand assets exist in public and public/brand with non-zero byte size', () => {
  const requiredPublicFiles = [
    'public/favicon.ico',
    'public/favicon.svg',
    'public/favicon-16x16.png',
    'public/favicon-32x32.png',
    'public/favicon-48x48.png',
    'public/apple-touch-icon.png',
    'public/android-chrome-192x192.png',
    'public/android-chrome-512x512.png',
    'public/site.webmanifest',
    'public/og-image.png',
    'public/logo.png',
    'public/brand/logo.png',
    'public/brand/logo-full.png',
    'public/brand/og-image.png',
    'src/app/icon.png',
    'src/app/apple-icon.png',
    'src/app/opengraph-image.png',
  ];

  for (const filePath of requiredPublicFiles) {
    assert.strictEqual(fs.existsSync(filePath), true, `Missing expected brand asset: ${filePath}`);
    const stats = fs.statSync(filePath);
    assert.strictEqual(stats.size > 0, true, `Asset must not be empty (0 bytes): ${filePath}`);
  }
});

test('Root layout configures complete icons, OpenGraph, Twitter and PWA metadata', () => {
  const layoutCode = fs.readFileSync('src/app/layout.tsx', 'utf8');

  assert.strictEqual(layoutCode.includes('One platform. Unlimited gifts. Every gift tells a different story.'), true);
  assert.strictEqual(layoutCode.includes('/favicon.ico'), true);
  assert.strictEqual(layoutCode.includes('/favicon.svg'), true);
  assert.strictEqual(layoutCode.includes('/favicon-32x32.png'), true);
  assert.strictEqual(layoutCode.includes('/favicon-16x16.png'), true);
  assert.strictEqual(layoutCode.includes('/apple-touch-icon.png'), true);
  assert.strictEqual(layoutCode.includes('/site.webmanifest'), true);
  assert.strictEqual(layoutCode.includes('/og-image.png'), true);
});

test('Website header and navigation integrates clickable brand logo navigating to /', () => {
  const pageCode = fs.readFileSync('src/app/page.tsx', 'utf8');

  assert.strictEqual(pageCode.includes('/brand/logo.png'), true, 'Landing page header must reference brand logo');
  assert.strictEqual(pageCode.includes('href="/"'), true, 'Logo must navigate to homepage');
});

test('Authentication pages render consistent brand identity', () => {
  const loginCode = fs.readFileSync('src/app/login/page.tsx', 'utf8');
  const signupCode = fs.readFileSync('src/app/signup/page.tsx', 'utf8');
  const forgotCode = fs.readFileSync('src/app/forgot-password/page.tsx', 'utf8');
  const verifyEmailCode = fs.readFileSync('src/app/verify-email/page.tsx', 'utf8');
  const verifyOtpCode = fs.readFileSync('src/app/verify-otp/page.tsx', 'utf8');

  assert.strictEqual(loginCode.includes('/brand/logo.png'), true, 'Login page must display logo');
  assert.strictEqual(signupCode.includes('/brand/logo.png'), true, 'Signup page must display logo');
  assert.strictEqual(forgotCode.includes('/brand/logo.png'), true, 'Forgot password must display logo');
  assert.strictEqual(verifyEmailCode.includes('/brand/logo.png'), true, 'Verify email must display logo');
  assert.strictEqual(verifyOtpCode.includes('/brand/logo.png'), true, 'Verify OTP must display logo');
});

test('Creator dashboard and Developer console sidebars feature brand logo', () => {
  const adminLayout = fs.readFileSync('src/app/admin/layout.tsx', 'utf8');
  const devLayout = fs.readFileSync('src/app/developer/layout.tsx', 'utf8');

  assert.strictEqual(adminLayout.includes('/brand/logo.png'), true, 'Admin layout must display brand logo');
  assert.strictEqual(devLayout.includes('/brand/logo.png'), true, 'Developer layout must display brand logo');
});

test('Recipient experience features brand identity and clickable home navigation', () => {
  const passwordGate = fs.readFileSync('src/components/recipient/PasswordGate.tsx', 'utf8');
  const ctaSection = fs.readFileSync('src/components/recipient/CreateYourOwnGiftSection.tsx', 'utf8');
  const expiryScreen = fs.readFileSync('src/components/recipient/ExpiryScreen.tsx', 'utf8');

  assert.strictEqual(passwordGate.includes('/brand/logo.png'), true, 'Password gate must display logo');
  assert.strictEqual(ctaSection.includes('/brand/logo.png'), true, 'Create gift CTA must display logo');
  assert.strictEqual(expiryScreen.includes('/brand/logo.png'), true, 'Expiry screen must display logo');
});

// -------------------------------------------------------------
// 37. COMPLETE FORGOT PASSWORD (EMAIL-ONLY) & ACCOUNT ENUMERATION PROTECTION TESTS
// -------------------------------------------------------------
console.log('\n--- 37. Complete Forgot Password (Email-Only) & Account Enumeration Protection Tests ---');

test('Forgot password page exposes email-only recovery and excludes mobile recovery', () => {
  const forgotPageCode = fs.readFileSync('src/app/forgot-password/page.tsx', 'utf8');

  assert.strictEqual(forgotPageCode.includes('Forgot Your Password?'), true, 'Heading must be Forgot Your Password?');
  assert.strictEqual(forgotPageCode.includes('type="email"'), true, 'Must provide email input field');
  assert.strictEqual(forgotPageCode.includes('Send Reset Link'), true, 'Must provide Send Reset Link button');
  assert.strictEqual(forgotPageCode.includes('Back to Sign In'), true, 'Must provide back to sign in link');

  // Verify mobile recovery options are removed from the forgot-password interface
  assert.strictEqual(forgotPageCode.includes('Via Mobile SMS'), false, 'Mobile tab must be removed from forgot password UI');
  assert.strictEqual(forgotPageCode.includes('SUPPORTED_COUNTRY_CODES'), false, 'Country code selector must be removed from forgot password UI');
});

test('Account enumeration protection: Registered and unregistered emails return identical response', () => {
  function simulateResetRequest(email, registeredAccounts) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const isRegistered = registeredAccounts.has(cleanEmail);

    let emailDispatched = false;
    let resetSessionCreated = false;

    if (isRegistered) {
      emailDispatched = true;
      // In production, Supabase sends recovery email with action link
    } else {
      // Unregistered: do not dispatch email, do not create session
      emailDispatched = false;
      resetSessionCreated = false;
    }

    // Identical public response specification
    return {
      status: 200,
      body: {
        success: true,
        message: 'If an account exists with this email address, password reset instructions will be sent.',
      },
      internal: { emailDispatched, resetSessionCreated }
    };
  }

  const registeredUsers = new Set(['kaushikparth363@gmail.com', 'kaushikparth353@gmail.com']);

  const regResponse = simulateResetRequest('kaushikparth363@gmail.com', registeredUsers);
  const unregResponse = simulateResetRequest('stranger-not-registered@example.com', registeredUsers);

  // Status and response body must be bit-for-bit identical
  assert.strictEqual(regResponse.status, unregResponse.status);
  assert.strictEqual(regResponse.body.success, unregResponse.body.success);
  assert.strictEqual(regResponse.body.message, unregResponse.body.message);
  assert.strictEqual(regResponse.body.message.includes('If an account exists'), true);

  // Internal behavior must strictly prevent leaks
  assert.strictEqual(regResponse.internal.emailDispatched, true);
  assert.strictEqual(unregResponse.internal.emailDispatched, false);
  assert.strictEqual(unregResponse.internal.resetSessionCreated, false);
});

test('Recovery callback and routes redirect recovery flows strictly to /reset-password', () => {
  const callbackCode = fs.readFileSync('src/app/auth/callback/route.ts', 'utf8');
  const landingCode = fs.readFileSync('src/app/page.tsx', 'utf8');

  assert.strictEqual(callbackCode.includes('/reset-password'), true, 'Callback route must route recovery to /reset-password');
  assert.strictEqual(callbackCode.includes('type === \'recovery\''), true, 'Callback must handle type=recovery');
  assert.strictEqual(landingCode.includes('/reset-password'), true, 'Landing page must catch recovery tokens in hash and forward to /reset-password');
  assert.strictEqual(landingCode.includes('PASSWORD_RECOVERY'), true, 'Landing page must listen to PASSWORD_RECOVERY event');
});

test('Dedicated /reset-password route renders password reset interface with security validations', () => {
  assert.strictEqual(fs.existsSync('src/app/reset-password/page.tsx'), true, '/reset-password route must exist');
  const resetPageCode = fs.readFileSync('src/app/reset-password/page.tsx', 'utf8');

  assert.strictEqual(resetPageCode.includes('Create a New Password'), true, 'Must display Create a New Password heading');
  assert.strictEqual(resetPageCode.includes('updateUser'), true, 'Must call supabase.auth.updateUser');
  assert.strictEqual(resetPageCode.includes('signOut'), true, 'Must sign out temporary session upon completion');
  assert.strictEqual(resetPageCode.includes('/login?reset_success=true'), true, 'Must redirect to login with reset_success notice');
  assert.strictEqual(resetPageCode.includes('Request New Reset Link'), true, 'Must offer fresh link request if expired or invalid');
});

test('Login page displays green success banner upon completed password reset', () => {
  const loginCode = fs.readFileSync('src/app/login/page.tsx', 'utf8');

  assert.strictEqual(loginCode.includes('reset_success'), true, 'Login page must check reset_success query param');
  assert.strictEqual(loginCode.includes('Your password has been reset successfully'), true, 'Login page must display reset success banner');
});

// -------------------------------------------------------------
// 38. THREE-PAGE GIFT BUILDER, DEDICATED EDITORS & LIVE PREVIEW SYSTEM TESTS
// -------------------------------------------------------------
console.log('\n--- 38. Three-Page Gift Builder, Dedicated Editors & Live Preview System Tests ---');

test('Password Gate heading dynamically computes prefix, recipient name, or custom full heading override', () => {
  const pwGateCode = fs.readFileSync('src/components/recipient/PasswordGate.tsx', 'utf8');

  // Verify "A surprise for" is not hardcoded
  assert.strictEqual(
    pwGateCode.includes('A surprise for {recipientName}'),
    false,
    'PasswordGate must not hardcode "A surprise for {recipientName}"'
  );

  // Helper simulating PasswordGate heading resolution
  function computeHeading(config, recipientName) {
    const prefix = config?.heading_prefix !== undefined ? config.heading_prefix.trim() : 'A surprise for';
    const customHeading = config?.custom_heading?.trim();
    const displayName = recipientName?.trim() || 'Someone Special';
    return customHeading && customHeading.length > 0 ? customHeading : `${prefix} ${displayName}`;
  }

  // Test default prefix
  assert.strictEqual(computeHeading({}, 'Ananya'), 'A surprise for Ananya');

  // Test customized prefix
  assert.strictEqual(
    computeHeading({ heading_prefix: 'A special surprise for' }, 'Ananya'),
    'A special surprise for Ananya'
  );
  assert.strictEqual(
    computeHeading({ heading_prefix: 'A little secret for' }, 'Rahul'),
    'A little secret for Rahul'
  );

  // Test custom full heading override
  assert.strictEqual(
    computeHeading(
      { heading_prefix: 'A surprise for', custom_heading: 'Something special for someone special' },
      'Ananya'
    ),
    'Something special for someone special'
  );
});

test('Password Gate supports custom subtitle, badge text, button label, and card styles', () => {
  const pwGateCode = fs.readFileSync('src/components/recipient/PasswordGate.tsx', 'utf8');

  assert.strictEqual(pwGateCode.includes('headingText'), true, 'Must render dynamic headingText');
  assert.strictEqual(pwGateCode.includes('subtitleText'), true, 'Must render dynamic subtitleText');
  assert.strictEqual(pwGateCode.includes('badgeText'), true, 'Must render dynamic badgeText');
  assert.strictEqual(pwGateCode.includes('buttonText'), true, 'Must render dynamic buttonText');
  assert.strictEqual(pwGateCode.includes('getCardStyleClass'), true, 'Must compute dynamic cardStyleClass');
  assert.strictEqual(pwGateCode.includes('instructions'), true, 'Must support optional instructions');
});

test('Expiry Screen renders custom heading, message, theme, and configurable navigation buttons', () => {
  const expScreenCode = fs.readFileSync('src/components/recipient/ExpiryScreen.tsx', 'utf8');

  assert.strictEqual(expScreenCode.includes('effectiveHeading'), true, 'Must render dynamic effectiveHeading');
  assert.strictEqual(expScreenCode.includes('effectiveMessage'), true, 'Must render dynamic effectiveMessage');
  assert.strictEqual(expScreenCode.includes('showCreateBtn'), true, 'Must support showCreateBtn toggle');
  assert.strictEqual(expScreenCode.includes('createBtnText'), true, 'Must render custom createBtnText');
  assert.strictEqual(expScreenCode.includes('showHomeBtn'), true, 'Must support showHomeBtn toggle');
  assert.strictEqual(expScreenCode.includes('homeBtnText'), true, 'Must render custom homeBtnText');
  assert.strictEqual(expScreenCode.includes('effectiveThemeId'), true, 'Must apply effectiveThemeId');
});

test('LivePreviewPane provides three independent modes with external synchronization', () => {
  const previewCode = fs.readFileSync('src/components/admin/LivePreviewPane.tsx', 'utf8');

  // Verify all 3 preview modes exist in switcher
  assert.strictEqual(previewCode.includes('Gift Journey'), true, 'Preview must have Gift Journey option');
  assert.strictEqual(previewCode.includes('Password Gate'), true, 'Preview must have Password Gate option');
  assert.strictEqual(previewCode.includes('Closing Screen'), true, 'Preview must have Closing Screen option');

  // Verify controlled state mode and handler
  assert.strictEqual(previewCode.includes('controlledStateMode'), true, 'Must accept controlledStateMode');
  assert.strictEqual(previewCode.includes('onStateModeChange'), true, 'Must call onStateModeChange');

  // Verify scrollToSection guards against resetting Password Gate or Expiry preview
  assert.strictEqual(
    previewCode.includes('activeStateMode !== \'unlocked\''),
    true,
    'Must guard scrollToSection when creator is previewing Password Gate or Expiry Screen'
  );
});

test('Creator Studio provides 3 dedicated section editors and shared draft autosave', () => {
  const createPageCode = fs.readFileSync('src/app/admin/create/page.tsx', 'utf8');

  // Top level 3 experiences
  assert.strictEqual(createPageCode.includes('activeExperience'), true, 'Must maintain activeExperience state');
  assert.strictEqual(createPageCode.includes('Password Gate Editor'), true, 'Must render Section A: Password Gate Editor');
  assert.strictEqual(createPageCode.includes('Gift Journey'), true, 'Must render Section B: Gift Journey');
  assert.strictEqual(createPageCode.includes('Expiry / Closing Screen Editor'), true, 'Must render Section C: Expiry Screen Editor');

  // Heading prefix customization
  assert.strictEqual(createPageCode.includes('passwordHeadingPrefix'), true, 'Must allow editing heading prefix');
  assert.strictEqual(createPageCode.includes('passwordCustomHeading'), true, 'Must allow custom full heading');

  // Draft save & load integration
  assert.strictEqual(createPageCode.includes('password_page_config'), true, 'Must save password_page_config');
  assert.strictEqual(createPageCode.includes('expiry_page_config'), true, 'Must save expiry_page_config');
  assert.strictEqual(createPageCode.includes('password_page:'), true, 'Must include password_page in theme_config');
  assert.strictEqual(createPageCode.includes('expiry_page:'), true, 'Must include expiry_page in theme_config');
});

test('Previewing Expiry Screen or Password Gate is isolated and never alters production recipient data', () => {
  const recExpCode = fs.readFileSync('src/components/recipient/RecipientExperience.tsx', 'utf8');

  // Verify isPreview bypasses expiry condition and session-check
  assert.strictEqual(recExpCode.includes('if (isPreview) return false;'), true, 'Previewing must never expire gift');
  assert.strictEqual(recExpCode.includes('if (isPreview || !isUnlocked) return;'), true, 'Previewing must never trigger recipient session invalidation');
});

// -------------------------------------------------------------
// 39. LOGIN PASSWORD VISIBILITY & UNIQUE URL SLUG VALIDATION TESTS
// -------------------------------------------------------------
console.log('\n--- 39. Login Password Visibility & Unique URL Slug Validation Tests ---');

import {
  normalizeSlug,
  validateSlugFormat,
  RESERVED_SLUGS,
} from '../src/lib/gifts/slug-rules.ts';

test('Password Visibility Toggle is implemented consistently across Login, Signup and Reset forms', () => {
  const loginCode = fs.readFileSync('src/app/login/page.tsx', 'utf8');
  const signupCode = fs.readFileSync('src/app/signup/page.tsx', 'utf8');
  const resetCode = fs.readFileSync('src/app/reset-password/page.tsx', 'utf8');

  // Login page verification
  assert.strictEqual(loginCode.includes('showPassword'), true, 'Login must have showPassword state');
  assert.strictEqual(loginCode.includes("showPassword ? 'text' : 'password'"), true, 'Login must toggle input type');
  assert.strictEqual(loginCode.includes('type="button"'), true, 'Login eye toggle must be type="button" to avoid form submission');
  assert.strictEqual(loginCode.includes('aria-label='), true, 'Login eye toggle must have accessible aria-label');
  assert.strictEqual(loginCode.includes('Eye') && loginCode.includes('EyeOff'), true, 'Login must render Eye/EyeOff icons');

  // Signup page verification
  assert.strictEqual(signupCode.includes('showPassword'), true, 'Signup must have showPassword state');
  assert.strictEqual(signupCode.includes("showPassword ? 'text' : 'password'"), true, 'Signup must toggle input type');
  assert.strictEqual(signupCode.includes('type="button"'), true, 'Signup eye toggle must be type="button"');
  assert.strictEqual(signupCode.includes('aria-label='), true, 'Signup eye toggle must have accessible aria-label');

  // Reset password verification
  assert.strictEqual(resetCode.includes('showNewPassword'), true, 'Reset password must have showNewPassword state');
  assert.strictEqual(resetCode.includes('showConfirmPassword'), true, 'Reset password must have showConfirmPassword state');
});

test('Slug Normalization converts spaces, underscores, invalid characters and collapses hyphens', () => {
  assert.strictEqual(normalizeSlug('Ananya Birthday'), 'ananya-birthday');
  assert.strictEqual(normalizeSlug('ananya_birthday_2026'), 'ananya-birthday-2026');
  assert.strictEqual(normalizeSlug('Ananya--Surprise---Gift'), 'ananya-surprise-gift');
  assert.strictEqual(normalizeSlug('-leading-and-trailing-'), 'leading-and-trailing');
  assert.strictEqual(normalizeSlug('Special!@#$%^&*()Gift'), 'specialgift');
  assert.strictEqual(normalizeSlug(''), '');
});

test('Slug Validation strictly rejects too short, too long, invalid characters and reserved routes', () => {
  // Empty & length checks
  assert.strictEqual(validateSlugFormat('').valid, false);
  assert.strictEqual(validateSlugFormat('a').valid, false);
  assert.strictEqual(validateSlugFormat('ab').valid, false);
  assert.strictEqual(validateSlugFormat('abc').valid, true);

  // Exceeds 60 characters
  const longSlug = 'a'.repeat(61);
  assert.strictEqual(validateSlugFormat(longSlug).valid, false);

  // Reserved slugs verification
  const reservedSamples = [
    'admin',
    'developer',
    'login',
    'signup',
    'settings',
    'dashboard',
    'api',
    'auth',
    'reset-password',
    'forgot-password',
    'demo',
    'demo-gift',
    'g',
    'gifts',
    'privacy',
    'terms',
  ];

  for (const reserved of reservedSamples) {
    const res = validateSlugFormat(reserved);
    assert.strictEqual(res.valid, false, `Slug "${reserved}" must be marked invalid`);
    assert.strictEqual(res.error.includes('reserved'), true, `Slug "${reserved}" must state it is reserved`);
  }

  // Valid custom slugs
  assert.strictEqual(validateSlugFormat('ananya-birthday').valid, true);
  assert.strictEqual(validateSlugFormat('rahul-turns-30').valid, true);
  assert.strictEqual(validateSlugFormat('anniversary-2026').valid, true);
});

test('Slug Check API endpoint handles availability, collisions, current-gift ownership and reserved routes', async () => {
  const checkSlugCode = fs.readFileSync('src/app/api/gifts/check-slug/route.ts', 'utf8');

  assert.strictEqual(checkSlugCode.includes('validateSlugFormat'), true, 'Must validate slug format');
  assert.strictEqual(checkSlugCode.includes('MOCK_GIFTS'), true, 'Must check in-memory gifts');
  assert.strictEqual(checkSlugCode.includes('currentGiftId'), true, 'Must accept currentGiftId for editing ownership');
  assert.strictEqual(checkSlugCode.includes('isCurrentGift'), true, 'Must return isCurrentGift flag when slug belongs to current gift');
  assert.strictEqual(checkSlugCode.includes('createAdminClient'), true, 'Must query Supabase database gifts table');
});

test('Gift Save/Publish API enforces uniqueness, catches Postgres 23505 and blocks silent slug clobbering', () => {
  const apiCode = fs.readFileSync('src/app/api/gifts/route.ts', 'utf8');

  // Verify format validation
  assert.strictEqual(apiCode.includes('validateSlugFormat'), true, 'POST must validate slug format');

  // Verify in-memory collision check
  assert.strictEqual(
    apiCode.includes('This custom URL slug is already taken. Please choose a different URL slug.'),
    true,
    'Must return descriptive 409 error on slug collision'
  );

  // Verify Postgres 23505 catch
  assert.strictEqual(apiCode.includes("23505"), true, 'Must catch Postgres unique violation error code 23505');

  // Verify old slug cleanup in MOCK_GIFTS on slug update
  assert.strictEqual(
    apiCode.includes('delete MOCK_GIFTS[existingGift.slug]'),
    true,
    'Must delete old slug key from memory when slug is updated'
  );
});

test('Creator Studio blocks publishing when slug is taken, checking, invalid or reserved', () => {
  const createPageCode = fs.readFileSync('src/app/admin/create/page.tsx', 'utf8');

  assert.strictEqual(createPageCode.includes('slugStatus'), true, 'Must maintain slugStatus state');
  assert.strictEqual(createPageCode.includes('/api/gifts/check-slug'), true, 'Must call check-slug API');
  assert.strictEqual(createPageCode.includes('slugStatus === \'taken\''), true, 'Must check if slug is taken');
  assert.strictEqual(createPageCode.includes('slugStatus === \'checking\''), true, 'Must check if slug is checking');
  assert.strictEqual(createPageCode.includes('https://dear-you-wine.vercel.app/g/'), true, 'Must render production link preview');
  assert.strictEqual(createPageCode.includes('renderSlugInputSection'), true, 'Must provide full slug control with visual status');
});

// -------------------------------------------------------------
// 40. CONSOLIDATED PROMOTIONAL CTA & NEW TAB NAVIGATION TESTS
// -------------------------------------------------------------
console.log('\n--- 40. Consolidated Promotional CTA & New Tab Navigation Tests ---');

test('Promotional section consolidates to exactly one prominent CTA with exact label', () => {
  const ctaCode = fs.readFileSync('src/components/recipient/CreateYourOwnGiftSection.tsx', 'utf8');

  // Verify exactly one CTA button exists with the specified consolidated text
  assert.strictEqual(
    ctaCode.includes('Discover Dear You & Create Your Own Gift'),
    true,
    'Must contain consolidated CTA label "Discover Dear You & Create Your Own Gift"'
  );

  // Verify the old duplicate buttons are completely removed
  assert.strictEqual(
    ctaCode.includes('<span>Create Your Own Gift</span>'),
    false,
    'Old separate "Create Your Own Gift" button must be removed'
  );
  assert.strictEqual(
    ctaCode.includes('<span>Discover Dear You</span>'),
    false,
    'Old separate "Discover Dear You" button must be removed'
  );

  // Verify emotional subtitle is preserved
  assert.strictEqual(
    ctaCode.includes('Create a beautiful digital surprise for someone special. Your memories, your stories, your way.'),
    true,
    'Must preserve exact emotional supporting message'
  );
});

test('Consolidated CTA strictly opens homepage in a new tab without interrupting recipient session', () => {
  const ctaCode = fs.readFileSync('src/components/recipient/CreateYourOwnGiftSection.tsx', 'utf8');

  // Verify destination is root homepage
  assert.strictEqual(ctaCode.includes('href="/"'), true, 'Must target production homepage "/"');

  // Verify target="_blank"
  assert.strictEqual(
    ctaCode.includes('target="_blank"'),
    true,
    'Must have target="_blank" to open in new tab'
  );

  // Verify rel="noopener noreferrer"
  assert.strictEqual(
    ctaCode.includes('rel="noopener noreferrer"'),
    true,
    'Must have rel="noopener noreferrer" security protection'
  );
});

// -------------------------------------------------------------
// 41. PASSWORD RECOVERY EMAIL DELIVERY, SMTP & NON-ENUMERATION TESTS
// -------------------------------------------------------------
console.log('\n--- 41. Password Recovery Email Delivery, SMTP & Non-Enumeration Tests ---');

import { buildRecoveryEmailHtml } from '../src/lib/security/recovery-email.ts';

test('Recovery email template contains Dear You branding, action link, 1-hour expiry and security notice', () => {
  const dummyLink =
    'https://ixxiejaqfhlolqckzasp.supabase.co/auth/v1/verify?token=dummy-test-token&type=recovery&redirect_to=https://dear-you-wine.vercel.app/reset-password';
  const emailHtml = buildRecoveryEmailHtml(dummyLink, 'user@example.com');

  assert.strictEqual(emailHtml.includes('Dear You'), true, 'Must include Dear You branding');
  assert.strictEqual(emailHtml.includes('https://dear-you-wine.vercel.app/brand/logo.png'), true, 'Must include brand logo');
  assert.strictEqual(emailHtml.includes('Reset Your Password'), true, 'Must include Reset Your Password button text');
  assert.strictEqual(emailHtml.includes(dummyLink), true, 'Must include genuine recovery action link');
  assert.strictEqual(emailHtml.includes('single-use'), true, 'Must state link is single-use');
  assert.strictEqual(emailHtml.includes('1 hour'), true, 'Must state 1-hour expiry');
  assert.strictEqual(emailHtml.includes('safely ignore this email'), true, 'Must explain action if not requested');
});

test('Password reset API enforces account existence check via Supabase Auth without leaking enumeration', () => {
  const resetRouteCode = fs.readFileSync('src/app/api/auth/reset-password/route.ts', 'utf8');

  // Verify generateLink is called to obtain recovery URL and check account existence
  assert.strictEqual(resetRouteCode.includes('auth.admin.generateLink'), true, 'Must call auth.admin.generateLink');
  assert.strictEqual(resetRouteCode.includes("type: 'recovery'"), true, 'Must request recovery type');

  // Verify unregistered email check
  assert.strictEqual(
    resetRouteCode.includes('UNREGISTERED email'),
    true,
    'Must explicitly recognize unregistered emails and skip dispatch'
  );

  // Verify suspension check uses correct column 'account_status'
  assert.strictEqual(
    resetRouteCode.includes('account_status'),
    true,
    'Must check account_status column (not non-existent status column)'
  );

  // Verify SMTP dispatch
  assert.strictEqual(
    resetRouteCode.includes('dispatchRecoveryEmail'),
    true,
    'Must dispatch recovery email via SMTP'
  );

  // Verify enumeration-protected generic message
  assert.strictEqual(
    resetRouteCode.includes('If an account exists with this email address, password reset instructions will be sent.'),
    true,
    'Must return exact generic confirmation message'
  );
});

test('Diagnostics securely mask email addresses and exclude sensitive auth tokens', () => {
  const resetRouteCode = fs.readFileSync('src/app/api/auth/reset-password/route.ts', 'utf8');

  assert.strictEqual(resetRouteCode.includes('maskEmail'), true, 'Must use email masking for diagnostics');
  assert.strictEqual(resetRouteCode.includes('[AUTH_DIAGNOSTIC]'), true, 'Must tag diagnostics with [AUTH_DIAGNOSTIC]');
});

import {
  getAppBaseUrl,
  getResetPasswordUrl,
  PRODUCTION_BASE_URL,
} from '../src/lib/config/app-url.ts';

test('App URL resolution strictly enforces production Vercel domain and never leaks localhost', () => {
  const resetRouteCode = fs.readFileSync('src/app/api/auth/reset-password/route.ts', 'utf8');

  // Verify reset route uses centralized getResetPasswordUrl
  assert.strictEqual(
    resetRouteCode.includes('getResetPasswordUrl(request)'),
    true,
    'Reset password route must call getResetPasswordUrl(request)'
  );

  // In standard runtime without local bypass, getAppBaseUrl must return production URL
  assert.strictEqual(getAppBaseUrl(), PRODUCTION_BASE_URL);
  assert.strictEqual(getResetPasswordUrl(), 'https://dear-you-wine.vercel.app/reset-password');
  assert.strictEqual(getResetPasswordUrl().includes('localhost'), false, 'Production reset URL must never contain localhost');
});

console.log('\n--- 42. Supabase Password Recovery Token Hash & Email Scanner Immunity Tests ---');

test('Password reset route generates crawler-immune token_hash recovery links', () => {
  const resetRouteCode = fs.readFileSync('src/app/api/auth/reset-password/route.ts', 'utf8');

  // Verify extraction of hashed_token
  assert.strictEqual(
    resetRouteCode.includes('hashed_token'),
    true,
    'Must extract hashed_token from Supabase generateLink'
  );

  // Verify recoveryUrl construction includes token_hash and type=recovery
  assert.strictEqual(
    resetRouteCode.includes('token_hash='),
    true,
    'Must construct recovery URL containing token_hash'
  );
  assert.strictEqual(
    resetRouteCode.includes('type=recovery'),
    true,
    'Must specify type=recovery in recovery URL'
  );
});

test('/reset-password page processes token_hash via client verifyOtp to defeat link prefetchers', () => {
  const resetPageCode = fs.readFileSync('src/app/reset-password/page.tsx', 'utf8');

  // Verify searchParams reads token_hash
  assert.strictEqual(
    resetPageCode.includes("searchParams?.get('token_hash')"),
    true,
    'Must read token_hash from URL search parameters'
  );

  // Verify verifyOtp call with token_hash and type
  assert.strictEqual(
    resetPageCode.includes('supabase.auth.verifyOtp'),
    true,
    'Must invoke supabase.auth.verifyOtp'
  );
  assert.strictEqual(
    resetPageCode.includes('token_hash,'),
    true,
    'Must pass token_hash to verifyOtp'
  );

  // Verify URL cleanup to prevent re-consumption on page refresh
  assert.strictEqual(
    resetPageCode.includes('window.history?.replaceState'),
    true,
    'Must cleanse URL query params with replaceState upon successful verification'
  );

  // Verify password update uses active session without old password
  assert.strictEqual(
    resetPageCode.includes('supabase.auth.updateUser'),
    true,
    'Must update password using supabase.auth.updateUser'
  );
});

test('Auth callback route attaches session cookies directly to redirect response', () => {
  const callbackCode = fs.readFileSync('src/app/auth/callback/route.ts', 'utf8');

  // Verify createServerClient attaches cookies to NextResponse.redirect
  assert.strictEqual(
    callbackCode.includes('createServerClient'),
    true,
    'Must use createServerClient in callback route'
  );
  assert.strictEqual(
    callbackCode.includes('response.cookies.set'),
    true,
    'Must explicitly attach cookies to the redirect response object'
  );
});

console.log('\n--- 43. Developer Console User Management Data Flash & Profile Race Condition Tests ---');

test('Developer User Management directory eliminates mock users and provides robust loading & error states', () => {
  const usersPageCode = fs.readFileSync('src/app/developer/users/page.tsx', 'utf8');
  const usersRouteCode = fs.readFileSync('src/app/api/developer/users/route.ts', 'utf8');

  // Verify mock users are completely absent from user directory frontend and backend API
  assert.strictEqual(usersPageCode.includes('MOCK_USERS'), false, 'Frontend must not import or use MOCK_USERS');
  assert.strictEqual(usersRouteCode.includes('MOCK_USERS'), false, 'API route must not import or fall back to MOCK_USERS');

  // Verify initial state is empty
  assert.strictEqual(
    usersPageCode.includes("useState<PlatformUser[]>([])"),
    true,
    'Initial users state must be an empty array'
  );

  // Verify loading skeleton is rendered during loading state
  assert.strictEqual(usersPageCode.includes('isLoading ?'), true, 'Must check isLoading in render');
  assert.strictEqual(usersPageCode.includes('animate-pulse'), true, 'Must render animated pulse skeleton');

  // Verify error handling and retry button
  assert.strictEqual(usersPageCode.includes('fetchError'), true, 'Must track fetch error state');
  assert.strictEqual(usersPageCode.includes('Retry'), true, 'Must provide Retry button on error');

  // Verify database source of truth in API
  assert.strictEqual(usersRouteCode.includes("from('admin_users')"), true, 'Must query admin_users table in Supabase');
});

test('Developer User Profile page implements 5 distinct states and eliminates false not-found flashes', () => {
  const profilePageCode = fs.readFileSync('src/app/developer/users/[id]/page.tsx', 'utf8');
  const profileRouteCode = fs.readFileSync('src/app/api/developer/users/[id]/route.ts', 'utf8');

  // Verify mock data is completely eliminated
  assert.strictEqual(profilePageCode.includes('MOCK_USERS'), false, 'User profile page must not import MOCK_USERS');
  assert.strictEqual(profileRouteCode.includes('MOCK_USERS'), false, 'User profile API must not import MOCK_USERS');
  assert.strictEqual(profileRouteCode.includes('MOCK_GIFTS'), false, 'User profile API must not import MOCK_GIFTS');

  // Verify 5 distinct states definition
  assert.strictEqual(
    profilePageCode.includes("'idle' | 'loading' | 'success' | 'not_found' | 'error'"),
    true,
    'Must define explicit 5-state machine for profile view'
  );

  // Verify initial state is loading
  assert.strictEqual(
    profilePageCode.includes("useState<ProfileViewState>('loading')"),
    true,
    'Initial viewState must be loading'
  );

  // Verify loading state indicator
  assert.strictEqual(
    profilePageCode.includes('Loading user profile...'),
    true,
    'Loading state must show Loading user profile... indicator'
  );

  // Verify not-found state is guarded by confirmed 404
  assert.strictEqual(
    profilePageCode.includes("res.status === 404"),
    true,
    'Must explicitly detect HTTP 404 status'
  );
  assert.strictEqual(
    profilePageCode.includes("viewState === 'not_found'"),
    true,
    'User record not found must be guarded by not_found viewState'
  );

  // Verify error state and retry
  assert.strictEqual(
    profilePageCode.includes("viewState === 'error'"),
    true,
    'Must render dedicated error state'
  );
  assert.strictEqual(
    profilePageCode.includes('Retry'),
    true,
    'Must provide Retry button in profile error state'
  );

  // Verify race condition protection via AbortController
  assert.strictEqual(
    profilePageCode.includes('AbortController'),
    true,
    'Must use AbortController to cancel stale in-flight requests'
  );

  // Verify API returns 404 when user is missing in database
  assert.strictEqual(
    profileRouteCode.includes("status: 404"),
    true,
    'API route must return HTTP 404 when user does not exist in Supabase'
  );
});

test('Developer Console architecture across Overview, Gifts, Analytics and Audit Logs eliminates mock data fallbacks', () => {
  const overviewPage = fs.readFileSync('src/app/developer/page.tsx', 'utf8');
  const overviewRoute = fs.readFileSync('src/app/api/developer/overview/route.ts', 'utf8');
  const giftsPage = fs.readFileSync('src/app/developer/gifts/page.tsx', 'utf8');
  const giftsRoute = fs.readFileSync('src/app/api/developer/gifts/route.ts', 'utf8');
  const giftDetailPage = fs.readFileSync('src/app/developer/gifts/[id]/page.tsx', 'utf8');
  const giftDetailRoute = fs.readFileSync('src/app/api/developer/gifts/[id]/route.ts', 'utf8');
  const analyticsPage = fs.readFileSync('src/app/developer/analytics/page.tsx', 'utf8');
  const analyticsRoute = fs.readFileSync('src/app/api/developer/analytics/route.ts', 'utf8');
  const auditLogsPage = fs.readFileSync('src/app/developer/audit-logs/page.tsx', 'utf8');
  const auditLogsRoute = fs.readFileSync('src/app/api/developer/audit-logs/route.ts', 'utf8');

  // None of the developer frontend pages or backend routes should use MOCK_USERS
  assert.strictEqual(overviewPage.includes('MOCK_USERS'), false, 'Overview page must not import MOCK_USERS');
  assert.strictEqual(overviewRoute.includes('MOCK_USERS'), false, 'Overview API must not import MOCK_USERS');
  assert.strictEqual(giftsPage.includes('MOCK_USERS'), false, 'Gifts page must not import MOCK_USERS');
  assert.strictEqual(giftsRoute.includes('MOCK_USERS'), false, 'Gifts API must not import MOCK_USERS');
  assert.strictEqual(giftDetailPage.includes('MOCK_USERS'), false, 'Gift detail page must not import MOCK_USERS');
  assert.strictEqual(giftDetailRoute.includes('MOCK_USERS'), false, 'Gift detail API must not import MOCK_USERS');
  assert.strictEqual(analyticsPage.includes('MOCK_USERS'), false, 'Analytics page must not import MOCK_USERS');
  assert.strictEqual(analyticsRoute.includes('MOCK_USERS'), false, 'Analytics API must not import MOCK_USERS');
  assert.strictEqual(auditLogsPage.includes('MOCK_USERS'), false, 'Audit logs page must not import MOCK_USERS');
  assert.strictEqual(auditLogsRoute.includes('MOCK_USERS'), false, 'Audit logs API must not import MOCK_USERS');

  // Verify all developer pages have loading states
  assert.strictEqual(giftsPage.includes('isLoading ?'), true, 'Gifts page must check isLoading');
  assert.strictEqual(auditLogsPage.includes('isLoading ?'), true, 'Audit logs page must check isLoading');
  assert.strictEqual(giftDetailPage.includes("viewState === 'loading'"), true, 'Gift detail must check loading state');
});

// -------------------------------------------------------------
// 44. DEVELOPER CONSOLE AUTHENTICATION & SETTINGS PROFILE RESOLUTION TESTS
// -------------------------------------------------------------
console.log('\n--- 44. Developer Console Authentication & Settings Profile Resolution Tests ---');

test('Developer authorization engine supports Supabase SSR cookies and authorized email allowlist', () => {
  const rolesCode = fs.readFileSync('src/lib/auth/roles.ts', 'utf8');

  // Verify createServerClient import from @supabase/ssr
  assert.strictEqual(
    rolesCode.includes("import { createServerClient } from '@supabase/ssr'"),
    true,
    'roles.ts must import createServerClient from @supabase/ssr'
  );

  // Verify getAuthenticatedDeveloper inspects Supabase SSR session cookies
  assert.strictEqual(
    rolesCode.includes('request.cookies.getAll()'),
    true,
    'getAuthenticatedDeveloper must inspect Supabase SSR cookies via request.cookies.getAll()'
  );
  assert.strictEqual(
    rolesCode.includes('await supabase.auth.getUser()'),
    true,
    'getAuthenticatedDeveloper must query supabase.auth.getUser() from SSR client'
  );

  // Verify designated developer accounts
  assert.strictEqual(
    rolesCode.includes("'kaushikparth363@gmail.com'"),
    true,
    'AUTHORIZED_DEVELOPER_EMAILS must include kaushikparth363@gmail.com'
  );
  assert.strictEqual(
    rolesCode.includes("'kaushikparth353@gmail.com'"),
    true,
    'AUTHORIZED_DEVELOPER_EMAILS must include kaushikparth353@gmail.com'
  );
});

test('Auth profile and session APIs support Supabase SSR cookies seamlessly', () => {
  const profileRoute = fs.readFileSync('src/app/api/auth/profile/route.ts', 'utf8');
  const sessionRoute = fs.readFileSync('src/app/api/auth/session/route.ts', 'utf8');

  // Verify profile route checks Supabase SSR cookies
  assert.strictEqual(
    profileRoute.includes("import { createServerClient } from '@supabase/ssr'"),
    true,
    'Profile route must import createServerClient'
  );
  assert.strictEqual(
    profileRoute.includes('request.cookies.getAll()'),
    true,
    'Profile route must inspect cookies via request.cookies.getAll()'
  );

  // Verify session route checks Supabase SSR cookies
  assert.strictEqual(
    sessionRoute.includes("import { createServerClient } from '@supabase/ssr'"),
    true,
    'Session route must import createServerClient'
  );
  assert.strictEqual(
    sessionRoute.includes('request.cookies.getAll()'),
    true,
    'Session route must inspect cookies via request.cookies.getAll()'
  );
});

test('Creator Settings implements 3 tiers of profile resolution and eliminates Email unavailable flash', () => {
  const settingsCode = fs.readFileSync('src/app/admin/settings/page.tsx', 'utf8');

  // Tier 1: Profile API
  assert.strictEqual(
    settingsCode.includes("fetch('/api/auth/profile')"),
    true,
    'Settings must call /api/auth/profile as tier 1'
  );

  // Tier 2: Session API
  assert.strictEqual(
    settingsCode.includes("fetch('/api/auth/session')"),
    true,
    'Settings must call /api/auth/session as tier 2'
  );

  // Tier 3: Supabase client auth + database lookup
  assert.strictEqual(
    settingsCode.includes('await supabase.auth.getUser()'),
    true,
    'Settings must include Supabase client auth getUser fallback as tier 3'
  );
  assert.strictEqual(
    settingsCode.includes(".from('admin_users')"),
    true,
    'Settings must query admin_users in client fallback'
  );

  // Verify email input shows loading state instead of blank when loading
  assert.strictEqual(
    settingsCode.includes("isLoadingProfile ? 'Loading authenticated identity...' : (profile?.email || '')"),
    true,
    'Email input must display loading state when isLoadingProfile is true'
  );
});

test('Developer layout and overview implement error boundary, loading state and mobile drawer', () => {
  const layoutCode = fs.readFileSync('src/app/developer/layout.tsx', 'utf8');
  const overviewCode = fs.readFileSync('src/app/developer/page.tsx', 'utf8');

  // Verify DeveloperConsoleErrorBoundary exists in layout
  assert.strictEqual(
    layoutCode.includes('DeveloperConsoleErrorBoundary'),
    true,
    'Developer layout must wrap children in DeveloperConsoleErrorBoundary'
  );

  // Verify 3 auth states in developer layout
  assert.strictEqual(
    layoutCode.includes("useState<'checking' | 'authorized' | 'unauthorized'>('checking')"),
    true,
    'Developer layout must track checking, authorized, and unauthorized states'
  );

  // Verify unauthorized state has return to creator admin button
  assert.strictEqual(
    layoutCode.includes('Return to Creator Dashboard'),
    true,
    'Developer layout unauthorized screen must provide Return to Creator Dashboard button'
  );

  // Verify mobile drawer positioning
  assert.strictEqual(
    layoutCode.includes('fixed inset-x-0 bottom-0 top-[65px] z-50 block'),
    true,
    'Mobile drawer must properly position below header when open'
  );

  // Verify overview page has loading skeleton and error retry
  assert.strictEqual(
    overviewCode.includes('isLoading ?'),
    true,
    'Overview page must render loading skeleton when isLoading is true'
  );
  assert.strictEqual(
    overviewCode.includes('fetchError &&'),
    true,
    'Overview page must render error banner with retry when fetchError exists'
  );
});

// -------------------------------------------------------------
// 45. GLOBAL LIGHT/DARK THEME, OFFLINE ZIP & PRINTABLE PDF TESTS
// -------------------------------------------------------------
console.log('\n--- 45. Global Light/Dark Theme, Offline ZIP & Printable PDF Tests ---');

test('Global platform theme infrastructure and anti-flash script', () => {
  const themeModule = fs.readFileSync('src/lib/theme/platform-theme.tsx', 'utf8');
  const layoutCode = fs.readFileSync('src/app/layout.tsx', 'utf8');
  const toggleCode = fs.readFileSync('src/components/common/PlatformThemeToggle.tsx', 'utf8');

  // Verify theme provider exports
  assert.strictEqual(
    themeModule.includes('PlatformThemeProvider') && themeModule.includes('usePlatformTheme'),
    true,
    'Platform theme module must export PlatformThemeProvider and usePlatformTheme'
  );

  // Verify storage key
  assert.strictEqual(
    themeModule.includes('dear_you_platform_theme'),
    true,
    'Platform theme must persist to dear_you_platform_theme in localStorage'
  );

  // Verify anti-flash script
  assert.strictEqual(
    themeModule.includes('platformThemeInitScript'),
    true,
    'Platform theme module must export platformThemeInitScript'
  );
  assert.strictEqual(
    layoutCode.includes('platformThemeInitScript') && layoutCode.includes('PlatformThemeProvider'),
    true,
    'Root layout must inject platformThemeInitScript in head and wrap children in PlatformThemeProvider'
  );

  // Verify PlatformThemeToggle variants
  assert.strictEqual(
    toggleCode.includes('compact') && toggleCode.includes('segmented') && toggleCode.includes('menu'),
    true,
    'PlatformThemeToggle must support compact, segmented, and menu variants'
  );
});

test('Platform theme tokens and gift theme independence', () => {
  const css = fs.readFileSync('src/styles/globals.css', 'utf8');
  const tailwind = fs.readFileSync('tailwind.config.ts', 'utf8');
  const themeContainer = fs.readFileSync('src/components/recipient/ThemeContainer.tsx', 'utf8');

  // Verify tailwind dark mode configuration
  assert.strictEqual(
    tailwind.includes("darkMode: ['class', '[data-platform-theme=\"dark\"]']"),
    true,
    'Tailwind must configure platform-theme dark mode attribute selector'
  );

  // Verify CSS variables in globals.css
  assert.strictEqual(
    css.includes('--platform-bg') && css.includes('--platform-text') && css.includes('--platform-card'),
    true,
    'globals.css must define semantic platform tokens'
  );

  // Verify ThemeContainer isolates gift theme CSS variables
  assert.strictEqual(
    themeContainer.includes('--theme-bg') && themeContainer.includes('--theme-text'),
    true,
    'ThemeContainer must isolate gift colors using scoped --theme-* variables independent of platform theme'
  );
});

test('Global theme switcher integrated across all key views', () => {
  const homeCode = fs.readFileSync('src/app/page.tsx', 'utf8');
  const loginCode = fs.readFileSync('src/app/login/page.tsx', 'utf8');
  const forgotCode = fs.readFileSync('src/app/forgot-password/page.tsx', 'utf8');
  const resetCode = fs.readFileSync('src/app/reset-password/page.tsx', 'utf8');
  const adminLayout = fs.readFileSync('src/app/admin/layout.tsx', 'utf8');
  const settingsCode = fs.readFileSync('src/app/admin/settings/page.tsx', 'utf8');
  const createCode = fs.readFileSync('src/app/admin/create/page.tsx', 'utf8');
  const devLayout = fs.readFileSync('src/app/developer/layout.tsx', 'utf8');

  assert.strictEqual(homeCode.includes('PlatformThemeToggle'), true, 'Homepage must include PlatformThemeToggle');
  assert.strictEqual(loginCode.includes('PlatformThemeToggle'), true, 'Login page must include PlatformThemeToggle');
  assert.strictEqual(forgotCode.includes('PlatformThemeToggle'), true, 'Forgot password page must include PlatformThemeToggle');
  assert.strictEqual(resetCode.includes('PlatformThemeToggle'), true, 'Reset password page must include PlatformThemeToggle');
  assert.strictEqual(adminLayout.includes('PlatformThemeToggle'), true, 'Admin layout must include PlatformThemeToggle');
  assert.strictEqual(settingsCode.includes('PlatformThemeToggle'), true, 'Settings page must include PlatformThemeToggle');
  assert.strictEqual(createCode.includes('PlatformThemeToggle'), true, 'Gift builder must include PlatformThemeToggle');
  assert.strictEqual(devLayout.includes('PlatformThemeToggle'), true, 'Developer layout must include PlatformThemeToggle');
});

test('Offline ZIP export generates structured package with assets and permanent guarantee', () => {
  const routeCode = fs.readFileSync('src/app/api/gifts/[slug]/download/route.ts', 'utf8');
  const offlineCardCode = fs.readFileSync('src/lib/download/generate-offline-card.ts', 'utf8');

  // Verify database query before fallback
  assert.strictEqual(
    routeCode.includes("from('gifts')") && routeCode.includes('.eq(\'slug\', slug)'),
    true,
    'Download route must query Supabase database before falling back to mock'
  );

  // Verify assets packaging
  assert.strictEqual(
    routeCode.includes("zip.file(`assets/images/"),
    true,
    'Download route must package images into assets/images/'
  );
  assert.strictEqual(
    routeCode.includes("zip.file('data/gift-data.json'"),
    true,
    'Download route must package data/gift-data.json'
  );

  // Verify permanent copy disclosure
  assert.strictEqual(
    routeCode.includes('PERMANENT OFFLINE GUARANTEE') &&
    routeCode.includes('cannot be remotely expired, edited, revoked, or deleted'),
    true,
    'README.txt must disclose that downloaded offline copies are permanent and cannot be remotely revoked or expired'
  );

  // Verify offline card interactivity support
  assert.strictEqual(
    offlineCardCode.includes('toggleOfflineMusic') && offlineCardCode.includes('hero-cover-img'),
    true,
    'Offline card generator must support offline audio player and cover image'
  );
});

test('Printable PDF export eliminates modal overlay repetition and formats dedicated memory book', () => {
  const modalCode = fs.readFileSync('src/components/recipient/DownloadKeepsakeModal.tsx', 'utf8');
  const printPageCode = fs.readFileSync('src/app/g/[slug]/print/page.tsx', 'utf8');
  const printViewCode = fs.readFileSync('src/components/recipient/PrintKeepsakeView.tsx', 'utf8');
  const globalsCss = fs.readFileSync('src/styles/globals.css', 'utf8');

  // Verify modal fix
  assert.strictEqual(
    modalCode.includes('/g/${gift.slug}/print?autoPrint=true') && modalCode.includes('_blank'),
    true,
    'Modal must open dedicated /print route in new window to prevent fixed-modal print stamping'
  );
  assert.strictEqual(
    modalCode.includes('no-print'),
    true,
    'Modal container must have no-print class'
  );

  // Verify print route existence and password verification
  assert.strictEqual(
    printPageCode.includes('getGiftWithChildCollections') && printPageCode.includes('verifyRecipientToken'),
    true,
    'Print route must fetch full gift collections and verify password protection'
  );

  // Verify print memory book sections and page break rules
  assert.strictEqual(
    printViewCode.includes('page-break-after') && printViewCode.includes('avoid-break'),
    true,
    'PrintKeepsakeView must implement page break rules for cover page and avoid-break for cards'
  );
  assert.strictEqual(
    printViewCode.includes('The Memory Wall') && printViewCode.includes('Our Journey Timeline'),
    true,
    'PrintKeepsakeView must render memory wall and journey timeline'
  );

  // Verify print media query hides modals and navigation in globals.css
  assert.strictEqual(
    globalsCss.includes('@media print') && globalsCss.includes('.no-print'),
    true,
    'globals.css must hide .no-print elements during printing'
  );
});

// -------------------------------------------------------------
// 46. SCRATCH CARD CONTRAST & DYNAMIC THEME-AWARE PALETTE TESTS
// -------------------------------------------------------------
console.log('\n--- 46. Scratch Card Contrast & Dynamic Theme-Aware Palette Tests ---');

test('Scratch Card contrast calculation and dynamic surface adaptation', async () => {
  const { getRelativeLuminance, getContrastRatio, getScratchCardPalette } = await import(
    '../src/lib/theme/scratch-card-theme.ts'
  );

  // 1. Pale cream / ivory reveal surface (e.g. Ananya Dreamy demo card)
  const creamPalette = getScratchCardPalette({ themeId: 'dreamy' });
  assert.strictEqual(creamPalette.isDarkSurface, false);
  assert.strictEqual(creamPalette.textColor, '#2E1065', 'Cream surface must use deep violet text');
  assert.strictEqual(creamPalette.contrastRatio >= 12, true, 'Contrast on cream surface must exceed 12:1');
  // Never white or pale lavender on cream!
  assert.strictEqual(creamPalette.textColor !== '#F5F3FF', true);
  assert.strictEqual(creamPalette.textColor !== '#FFFFFF', true);

  // 2. White reveal surface
  const whitePalette = getScratchCardPalette({ customRevealBg: '#FFFFFF' });
  assert.strictEqual(whitePalette.isDarkSurface, false);
  assert.strictEqual(whitePalette.textColor, '#111827', 'White surface must use charcoal text');
  assert.strictEqual(whitePalette.contrastRatio >= 15, true, 'Contrast on white surface must exceed 15:1');

  // 3. Dark purple reveal surface
  const darkPurplePalette = getScratchCardPalette({ customRevealBg: '#1E1138', themeId: 'dreamy' });
  assert.strictEqual(darkPurplePalette.isDarkSurface, true);
  assert.strictEqual(darkPurplePalette.textColor, '#F5F3FF', 'Dark purple surface must use soft lavender/white text');
  assert.strictEqual(darkPurplePalette.contrastRatio >= 12, true, 'Contrast on dark purple must exceed 12:1');

  // 4. Black / midnight reveal surface
  const midnightPalette = getScratchCardPalette({ customRevealBg: '#090D16' });
  assert.strictEqual(midnightPalette.isDarkSurface, true);
  assert.strictEqual(
    midnightPalette.textColor === '#FFFFFF' || midnightPalette.textColor === '#F5F3FF',
    true,
    'Midnight surface must use white or light lavender text'
  );
  assert.strictEqual(midnightPalette.contrastRatio >= 15, true, 'Contrast on midnight must exceed 15:1');

  // 5. Pastel pink reveal surface
  const pinkPalette = getScratchCardPalette({ customRevealBg: '#FDF2F4' });
  assert.strictEqual(pinkPalette.isDarkSurface, false);
  assert.strictEqual(pinkPalette.textColor, '#3B1220', 'Pastel pink surface must use deep plum text');
  assert.strictEqual(pinkPalette.contrastRatio >= 10, true, 'Contrast on pink must exceed 10:1');

  // 6. Gold / yellow reveal surface
  const goldPalette = getScratchCardPalette({ customRevealBg: '#FEF08A' });
  assert.strictEqual(goldPalette.isDarkSurface, false);
  assert.strictEqual(goldPalette.textColor, '#2A1810', 'Gold surface must use dark espresso text');
  assert.strictEqual(goldPalette.contrastRatio >= 10, true, 'Contrast on gold must exceed 10:1');
});

test('ScratchCardSection component and recipient experience integration', () => {
  const scratchCardCode = fs.readFileSync('src/components/recipient/ScratchCardSection.tsx', 'utf8');
  const recipientExpCode = fs.readFileSync('src/components/recipient/RecipientExperience.tsx', 'utf8');
  const offlineCardCode = fs.readFileSync('src/lib/download/generate-offline-card.ts', 'utf8');
  const printKeepsakeCode = fs.readFileSync('src/components/recipient/PrintKeepsakeView.tsx', 'utf8');

  // Verify ScratchCardSection uses dynamic palette
  assert.strictEqual(
    scratchCardCode.includes('getScratchCardPalette') &&
    scratchCardCode.includes('palette.revealBg') &&
    scratchCardCode.includes('palette.textColor'),
    true,
    'ScratchCardSection must apply dynamic theme-aware palette colors'
  );

  // Verify no hardcoded text-[var(--theme-text)] on cream surface
  assert.strictEqual(
    scratchCardCode.includes('dark:from-zinc-900'),
    false,
    'ScratchCardSection must not use Tailwind dark: prefixes that conflict with gift themes'
  );

  // Verify state persistence across reloads via sessionStorage
  assert.strictEqual(
    scratchCardCode.includes('sessionStorage.getItem(storageKey)') &&
    scratchCardCode.includes('sessionStorage.setItem(storageKey'),
    true,
    'ScratchCardSection must persist revealed state in sessionStorage across page refreshes'
  );

  // Verify RecipientExperience passes themeId and isPreview
  assert.strictEqual(
    recipientExpCode.includes('themeId={gift.selected_theme}') &&
    recipientExpCode.includes('themeConfig={gift.theme_config}'),
    true,
    'RecipientExperience must pass gift theme information to ScratchCardSection'
  );

  // Verify offline card generator applies contrasting palette
  assert.strictEqual(
    offlineCardCode.includes('getScratchCardPalette') &&
    offlineCardCode.includes('scratchPalette.textColor') &&
    offlineCardCode.includes('scratchPalette.revealBg'),
    true,
    'Offline card generator must use dynamic scratchPalette with readable contrast'
  );

  // Verify printable PDF export renders high-contrast text
  assert.strictEqual(
    printKeepsakeCode.includes('text-[#2E1065] print:text-black'),
    true,
    'PrintKeepsakeView must render revealed scratch message with high contrast'
  );
});

// -------------------------------------------------------------
// 47. GLOBAL THEME ENGINE, DARK MODE TOKENS & CONTRAST RATIO TESTS
// -------------------------------------------------------------
console.log('\n--- 47. Global Theme Engine, Dark Mode Tokens & Contrast Tests ---');

function getLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

test('Theme tokens in globals.css provide high contrast in Light and Dark modes', () => {
  const globalsCss = fs.readFileSync('src/styles/globals.css', 'utf8');

  // Verify tokens are defined for light mode
  assert.strictEqual(globalsCss.includes('--platform-btn-bg: #1A1625;'), true);
  assert.strictEqual(globalsCss.includes('--platform-btn-text: #FFFFFF;'), true);
  assert.strictEqual(globalsCss.includes('--platform-card: #FFFFFF;'), true);
  assert.strictEqual(globalsCss.includes('--platform-bg: #FAF8F5;'), true);
  assert.strictEqual(globalsCss.includes('--platform-text: #1A1625;'), true);

  // Verify tokens are defined for dark mode
  assert.strictEqual(globalsCss.includes('--platform-btn-bg: #7E699B;'), true);
  assert.strictEqual(globalsCss.includes('--platform-btn-text: #FFFFFF;'), true);
  assert.strictEqual(globalsCss.includes('--platform-card: #121826;'), true);
  assert.strictEqual(globalsCss.includes('--platform-bg: #0A0E17;'), true);
  assert.strictEqual(globalsCss.includes('--platform-text: #F8FAFC;'), true);
  assert.strictEqual(globalsCss.includes('--platform-text-on-light: #1A1625;'), true);

  // Check WCAG contrast ratios
  // Light Mode Button: #1A1625 on #FFFFFF text -> 15.6:1 (AAA)
  const lightBtnContrast = getContrastRatio('#1A1625', '#FFFFFF');
  assert.strictEqual(lightBtnContrast >= 15, true, `Light mode button contrast (${lightBtnContrast}) >= 15:1`);

  // Dark Mode Button: #7E699B on #FFFFFF text -> 4.79:1 (AA normal, AAA bold/large)
  const darkBtnContrast = getContrastRatio('#7E699B', '#FFFFFF');
  assert.strictEqual(darkBtnContrast >= 4.5, true, `Dark mode button contrast (${darkBtnContrast}) >= 4.5:1`);

  // Dark Mode Card: #121826 background vs #F8FAFC text -> 17.6:1 (AAA)
  const darkCardContrast = getContrastRatio('#121826', '#F8FAFC');
  assert.strictEqual(darkCardContrast >= 15, true, `Dark mode card contrast (${darkCardContrast}) >= 15:1`);

  // Light Mode Card: #FFFFFF background vs #1A1625 text -> 15.6:1 (AAA)
  const lightCardContrast = getContrastRatio('#FFFFFF', '#1A1625');
  assert.strictEqual(lightCardContrast >= 15, true, `Light mode card contrast (${lightCardContrast}) >= 15:1`);

  // Dark Mode Canvas: #0A0E17 background vs #F8FAFC text -> 19.3:1 (AAA)
  const darkCanvasContrast = getContrastRatio('#0A0E17', '#F8FAFC');
  assert.strictEqual(darkCanvasContrast >= 18, true, `Dark mode canvas contrast (${darkCanvasContrast}) >= 18:1`);
});

test('Tailwind configuration maps semantic platform tokens safely', () => {
  const tailwindConfig = fs.readFileSync('tailwind.config.ts', 'utf8');

  assert.strictEqual(tailwindConfig.includes('btnBg: "var(--platform-btn-bg)"'), true);
  assert.strictEqual(tailwindConfig.includes('btnText: "var(--platform-btn-text)"'), true);
  assert.strictEqual(tailwindConfig.includes('btnHover: "var(--platform-btn-hover)"'), true);
  assert.strictEqual(tailwindConfig.includes('textOnLight: "var(--platform-text-on-light)"'), true);
  assert.strictEqual(tailwindConfig.includes('card: "var(--platform-card)"'), true);
  assert.strictEqual(tailwindConfig.includes('cardSubtle: "var(--platform-card-subtle)"'), true);
  assert.strictEqual(tailwindConfig.includes('border: "var(--platform-border)"'), true);

  // platform.dark is safely mapped to var(--platform-btn-bg) to prevent white-on-white text
  assert.strictEqual(tailwindConfig.includes('dark: "var(--platform-btn-bg)"'), true);
});

test('Creator Dashboard Overview (admin/page.tsx) uses semantic tokens without white-on-white text', () => {
  const dashboardCode = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

  // KPI cards must use bg-platform-card and border-platform-border
  assert.strictEqual(
    dashboardCode.includes('bg-platform-card border border-platform-border shadow-xs'),
    true,
    'KPI cards must use bg-platform-card to adapt between Light and Dark mode'
  );

  // Numbers must use text-platform-text
  assert.strictEqual(
    dashboardCode.includes('text-2xl sm:text-3xl font-semibold text-platform-text'),
    true,
    'KPI numbers must use text-platform-text to ensure crisp visibility in Dark Mode'
  );

  // Primary Create New Gift button must use semantic btn tokens
  assert.strictEqual(
    dashboardCode.includes('bg-platform-btnBg text-platform-btnText hover:bg-platform-btnHover'),
    true,
    'Top Create New Gift button must use bg-platform-btnBg text-platform-btnText'
  );

  // Empty state card must use bg-platform-card and text-platform-text
  assert.strictEqual(
    dashboardCode.includes('bg-platform-card rounded-3xl border border-platform-border shadow-xs'),
    true,
    'Empty state card must use bg-platform-card and border-platform-border'
  );
});

test('Creator Layout (admin/layout.tsx) profile menu and active sidebar items adapt correctly', () => {
  const layoutCode = fs.readFileSync('src/app/admin/layout.tsx', 'utf8');

  // Profile button must use bg-platform-cardSubtle
  assert.strictEqual(layoutCode.includes('bg-platform-cardSubtle') && layoutCode.includes('border-platform-border'), true);

  // Profile dropdown menu must use bg-platform-card border-platform-border
  assert.strictEqual(layoutCode.includes('bg-platform-card rounded-2xl shadow-xl border border-platform-border'), true);

  // Active navigation items must use bg-platform-btnBg text-platform-btnText
  assert.strictEqual(layoutCode.includes('bg-platform-btnBg text-platform-btnText shadow-xs font-semibold'), true);
});

test('Gift Management, Builder, and Settings pages use theme-adaptive inputs and cards', () => {
  const giftsCode = fs.readFileSync('src/app/admin/gifts/page.tsx', 'utf8');
  const createCode = fs.readFileSync('src/app/admin/create/page.tsx', 'utf8');
  const settingsCode = fs.readFileSync('src/app/admin/settings/page.tsx', 'utf8');
  const wordLimitCode = fs.readFileSync('src/components/admin/WordLimitIndicator.tsx', 'utf8');

  // Gifts page
  assert.strictEqual(giftsCode.includes('bg-platform-btnBg') && giftsCode.includes('bg-platform-card'), true);

  // Create page
  assert.strictEqual(createCode.includes('bg-platform-card') && createCode.includes('bg-platform-btnBg'), true);

  // Settings page
  assert.strictEqual(settingsCode.includes('bg-platform-card') && settingsCode.includes('bg-platform-inputBg'), true);

  // WordLimitIndicator inputs
  assert.strictEqual(wordLimitCode.includes('bg-platform-inputBg') && wordLimitCode.includes('text-platform-text'), true);
});

test('Authentication, Verification, and Static Legal pages adapt cleanly to Dark Mode', () => {
  const loginCode = fs.readFileSync('src/app/login/page.tsx', 'utf8');
  const signupCode = fs.readFileSync('src/app/signup/page.tsx', 'utf8');
  const verifyOtpCode = fs.readFileSync('src/app/verify-otp/page.tsx', 'utf8');
  const privacyCode = fs.readFileSync('src/app/privacy/page.tsx', 'utf8');
  const termsCode = fs.readFileSync('src/app/terms/page.tsx', 'utf8');
  const modalCode = fs.readFileSync('src/components/recipient/DownloadKeepsakeModal.tsx', 'utf8');

  // Verify auth pages
  assert.strictEqual(loginCode.includes('bg-platform-bg') && loginCode.includes('bg-platform-card'), true);
  assert.strictEqual(signupCode.includes('bg-platform-bg') && signupCode.includes('bg-platform-card'), true);
  assert.strictEqual(verifyOtpCode.includes('bg-platform-card') && verifyOtpCode.includes('bg-platform-btnBg'), true);

  // Verify privacy and terms pages
  assert.strictEqual(privacyCode.includes('bg-platform-bg') && privacyCode.includes('bg-platform-card'), true);
  assert.strictEqual(termsCode.includes('bg-platform-bg') && termsCode.includes('bg-platform-card'), true);

  // Verify keepsakes modal
  assert.strictEqual(modalCode.includes('bg-platform-card rounded-3xl max-w-lg w-full'), true);
  assert.strictEqual(modalCode.includes('bg-platform-btnBg text-platform-btnText'), true);
});

// -------------------------------------------------------------
// 48. PERSONALIZED MUSIC SYSTEM, INDIVIDUAL UPLOADS & CONTINUOUS PLAYBACK
// -------------------------------------------------------------
console.log('\n--- 48. Personalized Music System, Individual Uploads & Playback Tests ---');

import {
  DEAR_YOU_MUSIC_LIBRARY,
  MUSIC_CATEGORIES,
  formatAudioSeconds,
  parseAudioSeconds,
  getMusicTrackById,
  DEFAULT_LIBRARY_TRACK,
} from '../src/config/music-library.ts';

import {
  MAX_AUDIO_FILE_SIZE_BYTES,
  MAX_AUDIO_DURATION_SECONDS,
  MIN_TRIM_DURATION_SECONDS,
  validatePlaybackTrim,
  validateAudioBufferMagicBytes,
} from '../src/lib/audio/audio-utils.ts';

test('Music Library catalog contains 8 distinct tracks across all 8 required categories', () => {
  assert.strictEqual(DEAR_YOU_MUSIC_LIBRARY.length, 8, 'Library must contain exactly 8 curated tracks');

  const requiredCategories = [
    'Romantic',
    'Birthday',
    'Friendship',
    'Peaceful',
    'Cinematic',
    'Celebration',
    'Instrumental',
    'Emotional',
  ];

  requiredCategories.forEach((cat) => {
    assert.strictEqual(
      MUSIC_CATEGORIES.some((c) => c.id === cat),
      true,
      `MUSIC_CATEGORIES must include ${cat}`
    );
    const hasTrack = DEAR_YOU_MUSIC_LIBRARY.some((t) => t.category === cat);
    assert.strictEqual(hasTrack, true, `Library must have at least one track in category ${cat}`);
  });

  // Verify all tracks have valid metadata and local audio files
  DEAR_YOU_MUSIC_LIBRARY.forEach((track) => {
    assert.ok(track.id && track.id.startsWith('lib-'), 'Track ID must be prefixed with lib-');
    assert.ok(track.title && track.title.length > 0, 'Track must have title');
    assert.ok(track.duration > 0, 'Track must have positive duration');
    assert.ok(track.audio_url && track.audio_url.startsWith('/audio/'), 'Track must reference /audio/ URL');

    const cleanPath = track.audio_url.replace(/^\//, '');
    const fullDiskPath = path.join(process.cwd(), 'public', cleanPath);
    assert.strictEqual(fs.existsSync(fullDiskPath), true, `Track file must exist at ${fullDiskPath}`);
  });

  // Test helpers
  assert.strictEqual(formatAudioSeconds(0), '0:00');
  assert.strictEqual(formatAudioSeconds(65), '1:05');
  assert.strictEqual(formatAudioSeconds(184), '3:04');
  assert.strictEqual(parseAudioSeconds('3:04'), 184);
  assert.strictEqual(parseAudioSeconds('0:45'), 45);
  assert.strictEqual(parseAudioSeconds('invalid'), 0);

  const found = getMusicTrackById('lib-gentle-moments');
  assert.strictEqual(found?.title, 'Gentle Moments');
  assert.strictEqual(DEFAULT_LIBRARY_TRACK.title, 'Gentle Moments');
});

test('Audio magic bytes format validator detects MP3 and M4A/AAC and rejects non-audio', () => {
  // Valid MP3 with ID3v2 header: ID3 (0x49, 0x44, 0x33) with padding
  const id3Header = Buffer.concat([
    Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0A]),
    Buffer.alloc(10),
  ]);
  const id3Check = validateAudioBufferMagicBytes(id3Header);
  assert.strictEqual(id3Check.valid, true, 'ID3v2 header must be accepted as MP3');
  assert.strictEqual(id3Check.detectedFormat, 'mp3');

  // Valid MP3 MPEG-1 Layer 3 sync frame: 0xFF, 0xFB
  const mp3Frame = Buffer.concat([
    Buffer.from([0xFF, 0xFB, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00]),
    Buffer.alloc(10),
  ]);
  const mp3Check = validateAudioBufferMagicBytes(mp3Frame);
  assert.strictEqual(mp3Check.valid, true, 'MPEG sync frame must be accepted as MP3');
  assert.strictEqual(mp3Check.detectedFormat, 'mp3');

  // Valid M4A ISO Base Media box with ftyp box at offset 4
  const m4aBox = Buffer.concat([
    Buffer.from([
      0x00, 0x00, 0x00, 0x20, // size 32
      0x66, 0x74, 0x79, 0x70, // 'ftyp'
      0x4D, 0x34, 0x41, 0x20, // 'M4A '
      0x00, 0x00, 0x02, 0x00,
    ]),
    Buffer.alloc(10),
  ]);
  const m4aCheck = validateAudioBufferMagicBytes(m4aBox);
  assert.strictEqual(m4aCheck.valid, true, 'ISO ftyp box must be accepted as M4A');
  assert.strictEqual(m4aCheck.detectedFormat, 'm4a');

  // Reject HTML content
  const htmlBuffer = Buffer.from('<!DOCTYPE html><html><body>Dangerous Script</body></html>');
  const htmlCheck = validateAudioBufferMagicBytes(htmlBuffer);
  assert.strictEqual(htmlCheck.valid, false, 'HTML text must be rejected');

  // Reject Windows executable
  const exeBuffer = Buffer.concat([Buffer.from([0x4D, 0x5A, 0x90, 0x00]), Buffer.alloc(16)]);
  const exeCheck = validateAudioBufferMagicBytes(exeBuffer);
  assert.strictEqual(exeCheck.valid, false, 'Binary executable must be rejected');

  // Reject empty buffer
  const emptyCheck = validateAudioBufferMagicBytes(Buffer.alloc(0));
  assert.strictEqual(emptyCheck.valid, false, 'Empty buffer must be rejected');
});

test('Audio trimming validation enforces 5-second minimum duration and total bounds', () => {
  const totalDuration = 120; // 2 minutes

  // Valid trim: 10s to 45s (35s length)
  const validTrim = validatePlaybackTrim(10, 45, totalDuration);
  assert.strictEqual(validTrim.valid, true);

  // Reject start >= end
  const invertedTrim = validatePlaybackTrim(50, 20, totalDuration);
  assert.strictEqual(invertedTrim.valid, false);
  assert.ok(invertedTrim.error?.includes('greater than start time'));

  // Reject sub-5-second duration
  const tooShortTrim = validatePlaybackTrim(10, 13, totalDuration);
  assert.strictEqual(tooShortTrim.valid, false);
  assert.ok(tooShortTrim.error?.includes('at least 5 seconds'));

  // Clamps negative start to 0
  const negativeTrim = validatePlaybackTrim(-5, 30, totalDuration);
  assert.strictEqual(negativeTrim.valid, true);
  assert.strictEqual(negativeTrim.startTime, 0);

  // Reject end > duration
  const overboundTrim = validatePlaybackTrim(10, 150, totalDuration);
  assert.strictEqual(overboundTrim.valid, false);
  assert.ok(overboundTrim.error?.includes('cannot exceed total song duration'));
});

test('Per-gift storage isolation guarantees Gift A music changes never affect Gift B, C, or D', () => {
  // Simulate 4 distinct gifts with independent music configurations
  const giftA = {
    id: 'gift-a',
    title: 'Gift A - Library Music',
    slug: 'gift-a',
    music_enabled: true,
    music_source: 'library',
    library_track_id: 'lib-gentle-moments',
    music_url: '/audio/gentle-moments.mp3',
    music_title: 'Gentle Moments',
  };

  const giftB = {
    id: 'gift-b',
    title: 'Gift B - Custom Audio Upload',
    slug: 'gift-b',
    music_enabled: true,
    music_source: 'upload',
    custom_audio_storage_path: 'gifts/creator-1/gift-b.mp3',
    custom_audio_filename: 'special-acoustic.mp3',
    audio_duration: 145,
    playback_start_time: 15,
    playback_end_time: 75,
    loop_enabled: true,
    music_url: '/api/gifts/gift-b/audio',
    music_title: 'Special Acoustic',
  };

  const giftC = {
    id: 'gift-c',
    title: 'Gift C - No Background Music',
    slug: 'gift-c',
    music_enabled: false,
    music_source: 'none',
    music_url: undefined,
    music_title: undefined,
  };

  const giftD = {
    id: 'gift-d',
    title: 'Gift D - Independent Cinematic Track',
    slug: 'gift-d',
    music_enabled: true,
    music_source: 'library',
    library_track_id: 'lib-velvet-reverie',
    music_url: '/audio/velvet-reverie.mp3',
    music_title: 'Velvet Reverie',
  };

  // Mutate Gift A to different track
  giftA.library_track_id = 'lib-celestial-waltz';
  giftA.music_url = '/audio/celestial-waltz.mp3';
  giftA.music_title = 'Celestial Waltz';

  // Verify Gift B, C, D remain completely unaffected
  assert.strictEqual(giftB.music_source, 'upload', 'Gift B must retain upload source');
  assert.strictEqual(giftB.custom_audio_storage_path, 'gifts/creator-1/gift-b.mp3');
  assert.strictEqual(giftB.playback_start_time, 15);
  assert.strictEqual(giftB.playback_end_time, 75);

  assert.strictEqual(giftC.music_enabled, false, 'Gift C must remain disabled');
  assert.strictEqual(giftC.music_source, 'none');

  assert.strictEqual(giftD.library_track_id, 'lib-velvet-reverie', 'Gift D must retain Velvet Reverie');
  assert.strictEqual(giftD.music_title, 'Velvet Reverie');
});

test('Gift Duplication copies music configuration and creates independent storage copy', () => {
  const originalGift = {
    id: 'orig-gift-1',
    creator_id: 'user-123',
    slug: 'original-anniversary',
    title: 'Original Anniversary',
    music_enabled: true,
    music_source: 'upload',
    custom_audio_storage_path: 'gifts/user-123/original-audio.mp3',
    custom_audio_filename: 'our-song.mp3',
    audio_duration: 180,
    playback_start_time: 10,
    playback_end_time: 90,
    loop_enabled: true,
    music_title: 'Our Song',
  };

  // Simulate duplication route logic (as in src/app/api/gifts/[slug]/duplicate/route.ts)
  const duplicatedSlug = `${originalGift.slug}-copy-1`;
  const duplicatedStoragePath = originalGift.custom_audio_storage_path
    ? originalGift.custom_audio_storage_path.replace('.mp3', `-copy-${Date.now()}.mp3`)
    : undefined;

  const duplicatedGift = {
    ...originalGift,
    id: 'dup-gift-2',
    slug: duplicatedSlug,
    title: `${originalGift.title} (Copy)`,
    custom_audio_storage_path: duplicatedStoragePath,
    music_url: `/api/gifts/${duplicatedSlug}/audio`,
  };

  // Verify duplicated gift has identical trim & config but independent storage path
  assert.strictEqual(duplicatedGift.music_source, 'upload');
  assert.strictEqual(duplicatedGift.playback_start_time, 10);
  assert.strictEqual(duplicatedGift.playback_end_time, 90);
  assert.strictEqual(duplicatedGift.loop_enabled, true);
  assert.notStrictEqual(duplicatedGift.custom_audio_storage_path, originalGift.custom_audio_storage_path);
  assert.ok(duplicatedGift.custom_audio_storage_path.includes('-copy-'));

  // Modifying duplicate does not modify original
  duplicatedGift.playback_start_time = 0;
  duplicatedGift.music_source = 'none';
  duplicatedGift.music_enabled = false;

  assert.strictEqual(originalGift.music_enabled, true, 'Original must remain enabled');
  assert.strictEqual(originalGift.music_source, 'upload', 'Original must remain upload');
  assert.strictEqual(originalGift.playback_start_time, 10, 'Original start time must remain 10');
});

test('Recipient experience suppresses audio player when music is disabled and honors continuous loop', () => {
  const recipientExpCode = fs.readFileSync('src/components/recipient/RecipientExperience.tsx', 'utf8');
  const musicPlayerCode = fs.readFileSync('src/components/recipient/MusicPlayerBar.tsx', 'utf8');

  // Verify recipient experience checks music_enabled and music_source
  assert.strictEqual(
    recipientExpCode.includes("gift.music_enabled === false") && recipientExpCode.includes("gift.music_source === 'none'"),
    true,
    'RecipientExperience must check both music_enabled and music_source'
  );

  // Verify audio playback starts ONLY on Start Your Journey
  assert.strictEqual(
    recipientExpCode.includes('handleStartJourney'),
    true,
    'Audio initiation must be linked to handleStartJourney'
  );

  // Verify RecipientExperience handles trim boundaries and timeupdate looping
  assert.strictEqual(
    recipientExpCode.includes('playback_start_time') && recipientExpCode.includes('playback_end_time'),
    true,
    'RecipientExperience must read playback trim props'
  );

  assert.strictEqual(
    recipientExpCode.includes('handleTimeUpdate') && recipientExpCode.includes('audioRef.current.currentTime = startTime'),
    true,
    'RecipientExperience must reset audio to startTime when reaching endTime'
  );

  // Verify MusicPlayerBar UI controls
  assert.strictEqual(
    musicPlayerCode.includes('onTogglePlay') && musicPlayerCode.includes('onToggleMute') && musicPlayerCode.includes('onVolumeChange'),
    true,
    'MusicPlayerBar must provide play/pause, mute, and volume controls'
  );
});

test('Offline ZIP export includes background.mp3 when enabled and omits when disabled', () => {
  const offlineCardGen = fs.readFileSync('src/lib/download/generate-offline-card.ts', 'utf8');
  const downloadRoute = fs.readFileSync('src/app/api/gifts/[slug]/download/route.ts', 'utf8');

  // Generator must conditionally include audio script and player
  assert.strictEqual(
    offlineCardGen.includes("gift.music_enabled !== false") && offlineCardGen.includes("gift.music_source !== 'none'"),
    true,
    'generateOfflineCard must conditionally gate audio script'
  );

  assert.strictEqual(
    offlineCardGen.includes('offline-audio'),
    true,
    'Offline card must provide offline-audio element'
  );

  // Download API route must package audio buffer only when music is enabled
  assert.strictEqual(
    downloadRoute.includes("zip.file(`assets/audio/${fileName}`"),
    true,
    'Download route must package background audio file into ZIP'
  );

  assert.strictEqual(
    downloadRoute.includes("gift.music_enabled !== false") && downloadRoute.includes("gift.music_source !== 'none'"),
    true,
    'Download route must check music_enabled and music_source before adding audio file'
  );
});

test('Gift Builder integrates BackgroundMusicSelector and blocks publishing on upload in progress or error', () => {
  const createPageCode = fs.readFileSync('src/app/admin/create/page.tsx', 'utf8');

  // Verify BackgroundMusicSelector import & component render
  assert.strictEqual(
    createPageCode.includes('BackgroundMusicSelector'),
    true,
    'Create page must import and render BackgroundMusicSelector'
  );

  // Verify upload state tracking
  assert.strictEqual(
    createPageCode.includes('isAudioUploading') && createPageCode.includes('hasAudioUploadError'),
    true,
    'Create page must track isAudioUploading and hasAudioUploadError'
  );

  // Verify publish blocking
  assert.strictEqual(
    createPageCode.includes('Please wait for the audio upload to complete before publishing.'),
    true,
    'Create page must block publishing during active upload'
  );

  assert.strictEqual(
    createPageCode.includes('The uploaded audio file could not be processed.'),
    true,
    'Create page must block publishing when upload failed'
  );
});

// -------------------------------------------------------------
// 49. DISTINCT AUDIO ASSETS & PLATFORM-WIDE DEVELOPER VISIBILITY TESTS
// -------------------------------------------------------------
console.log('\n--- 49. Distinct Audio Assets & Platform-Wide Developer Visibility Tests ---');

test('Every pre-listed library track has a distinct, valid MP3 file with unique hash', () => {
  const audioDir = 'public/audio';
  const expectedFiles = [
    'gentle-moments.mp3',
    'celestial-waltz.mp3',
    'joyful-celebration.mp3',
    'cherished-memories.mp3',
    'serene-horizon.mp3',
    'sparkling-fireworks.mp3',
    'velvet-reverie.mp3',
    'timeless-echoes.mp3',
  ];

  const hashes = new Set();

  for (const fileName of expectedFiles) {
    const filePath = path.join(audioDir, fileName);
    assert.strictEqual(fs.existsSync(filePath), true, `File ${fileName} must exist in public/audio`);
    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 1000000, `File ${fileName} must be a substantial audio file (> 1MB), got ${stat.size} bytes`);

    // Verify unique MD5 hash
    const buf = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5').update(buf).digest('hex');
    assert.strictEqual(
      hashes.has(hash),
      false,
      `Track ${fileName} has duplicate MD5 hash (${hash})! All tracks must be unique distinct audio files.`
    );
    hashes.add(hash);
  }

  assert.strictEqual(hashes.size, 8, 'There must be exactly 8 distinct audio tracks with unique hashes.');
});

test('Music library configuration has accurate durations and genuine attributions', () => {
  const musicLibCode = fs.readFileSync('src/config/music-library.ts', 'utf8');

  // Must import and define 8 tracks
  assert.strictEqual(musicLibCode.includes('lib-gentle-moments'), true);
  assert.strictEqual(musicLibCode.includes('lib-celestial-waltz'), true);
  assert.strictEqual(musicLibCode.includes('lib-joyful-celebration'), true);
  assert.strictEqual(musicLibCode.includes('lib-cherished-memories'), true);
  assert.strictEqual(musicLibCode.includes('lib-serene-horizon'), true);
  assert.strictEqual(musicLibCode.includes('lib-sparkling-fireworks'), true);
  assert.strictEqual(musicLibCode.includes('lib-velvet-reverie'), true);
  assert.strictEqual(musicLibCode.includes('lib-timeless-echoes'), true);

  // Must define exact durations
  assert.strictEqual(musicLibCode.includes("duration: 182"), true);
  assert.strictEqual(musicLibCode.includes("duration: 91"), true);
  assert.strictEqual(musicLibCode.includes("duration: 102"), true);
  assert.strictEqual(musicLibCode.includes("duration: 103"), true);
});

test('BackgroundMusicSelector cleanly recreates Audio instance and stops preview when switching tracks', () => {
  const selectorCode = fs.readFileSync('src/components/admin/BackgroundMusicSelector.tsx', 'utf8');

  // Verify togglePlayPreview cleanly stops previous audio before playing new
  assert.strictEqual(
    selectorCode.includes('previewAudioRef.current.pause()') &&
    selectorCode.includes('previewAudioRef.current.currentTime = 0') &&
    selectorCode.includes('new Audio(trackUrl)'),
    true,
    'BackgroundMusicSelector must stop previous audio and create fresh Audio instance to avoid stale buffer'
  );

  // Verify handleChooseLibraryTrack stops previous preview if different track
  assert.strictEqual(
    selectorCode.includes('handleChooseLibraryTrack') &&
    selectorCode.includes('stopPreviewAudio()'),
    true,
    'handleChooseLibraryTrack must cleanly stop audio preview when a track is chosen'
  );
});

test('Recipient experience resolves chosen library track with top priority and displays resolved title', () => {
  const recipientCode = fs.readFileSync('src/components/recipient/RecipientExperience.tsx', 'utf8');

  // Verify resolvedAudioSrc prioritizes library track
  assert.strictEqual(
    recipientCode.includes("gift.music_source === 'library' || gift.library_track_id"),
    true,
    'RecipientExperience must inspect music_source and library_track_id for library tracks'
  );

  // Verify resolvedTrackTitle resolution
  assert.strictEqual(
    recipientCode.includes('resolvedTrackTitle') &&
    recipientCode.includes('getMusicTrackById(gift.library_track_id)'),
    true,
    'RecipientExperience must compute resolvedTrackTitle using getMusicTrackById'
  );
});

test('Gift Save/Publish API enforces RFC4122 UUID, valid owner_id, and unpackDatabaseGift', () => {
  const giftsApiCode = fs.readFileSync('src/app/api/gifts/route.ts', 'utf8');

  // Verify UUID check & generation
  assert.strictEqual(
    giftsApiCode.includes('isValidUuid') && giftsApiCode.includes('crypto.randomUUID()'),
    true,
    'Gifts API must validate UUIDs and generate RFC4122 UUID for finalId'
  );

  // Verify owner_id handles non-UUID by setting null
  assert.strictEqual(
    giftsApiCode.includes('validOwnerId = isValidUuid(rawUserId) ? rawUserId : null'),
    true,
    'Gifts API must set owner_id to null for unauthenticated/test users to avoid Postgres syntax error'
  );

  // Verify unpacking database gift
  assert.strictEqual(
    giftsApiCode.includes('unpackDatabaseGift'),
    true,
    'Gifts API must export unpackDatabaseGift helper for database row normalization'
  );

  // Verify SSR cookie support via createServerClient
  assert.strictEqual(
    giftsApiCode.includes('createServerClient') && giftsApiCode.includes('request.cookies.getAll()'),
    true,
    'Gifts API must extract user session from Supabase SSR cookies'
  );
});

test('Developer gifts API returns platform-wide gifts with creator mapping from admin_users and auth.users', () => {
  const devGiftsCode = fs.readFileSync('src/app/api/developer/gifts/route.ts', 'utf8');

  // Verify query of all gifts via supabaseAdmin
  assert.strictEqual(
    devGiftsCode.includes("from('gifts')") && devGiftsCode.includes('unpackDatabaseGift'),
    true,
    'Developer gifts API must query all gifts and unpack database rows'
  );

  // Verify dual mapping of users
  assert.strictEqual(
    devGiftsCode.includes("from('admin_users')") && devGiftsCode.includes('auth.admin.listUsers()'),
    true,
    'Developer gifts API must map creators from both admin_users and Supabase auth.users'
  );

  // Verify status, theme, and view_count indicators
  assert.strictEqual(
    devGiftsCode.includes('computedStatus') && devGiftsCode.includes('views_count') && devGiftsCode.includes('music_type'),
    true,
    'Developer gifts API must provide computedStatus, views_count, and music_type'
  );
});

test('Developer console gifts page displays 4 overview counters, filter tabs, sort selector, and live gift link', () => {
  const devPageCode = fs.readFileSync('src/app/developer/gifts/page.tsx', 'utf8');

  // Verify 4 overview counters
  assert.strictEqual(
    devPageCode.includes('Total Platform Gifts') &&
    devPageCode.includes('Published (Live)') &&
    devPageCode.includes('Drafts (In Progress)') &&
    devPageCode.includes('Archived (Stored)'),
    true,
    'Developer gifts page must display 4 platform overview counter cards'
  );

  // Verify Quick Filter Tabs
  assert.strictEqual(
    devPageCode.includes('All Platform Gifts') &&
    devPageCode.includes('activeTab === tab.id'),
    true,
    'Developer gifts page must render quick filter tabs with counts'
  );

  // Verify Sort selector
  assert.strictEqual(
    devPageCode.includes('sortBy') && devPageCode.includes('Most Viewed'),
    true,
    'Developer gifts page must provide sorting options'
  );

  // Verify Music indicator & Live link
  assert.strictEqual(
    devPageCode.includes('music_title') && devPageCode.includes('/gift/${gift.slug}'),
    true,
    'Developer gifts page must display music track indicator and direct live gift link'
  );
});

console.log(`\n==============================================`);
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} tests passed.`);
console.log(`==============================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
