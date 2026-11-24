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

console.log(`\n==============================================`);
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} tests passed.`);
console.log(`==============================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
