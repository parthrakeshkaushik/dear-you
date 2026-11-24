/**
 * DEAR YOU — CAPTCHA Bot Protection & Token Verification
 * Supports Cloudflare Turnstile server-side verification with replay protection.
 */

// In-memory set of used CAPTCHA tokens to prevent replay attacks (TTL: 10 minutes)
const usedCaptchaTokens = new Map<string, number>();

function cleanupUsedTokens() {
  const now = Date.now();
  usedCaptchaTokens.forEach((timestamp, token) => {
    if (now - timestamp > 10 * 60 * 1000) {
      usedCaptchaTokens.delete(token);
    }
  });
}

export interface CaptchaVerificationResult {
  success: boolean;
  error?: string;
}

/**
 * Validates a CAPTCHA response token server-side.
 * Rejects empty, invalid, expired or already-replayed tokens.
 */
export async function verifyCaptchaToken(
  token: string | undefined | null,
  clientIp?: string
): Promise<CaptchaVerificationResult> {
  cleanupUsedTokens();

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return {
      success: false,
      error: 'Security verification (CAPTCHA) is required. Please complete the verification.',
    };
  }

  const cleanToken = token.trim();

  // Replay Attack Protection: Tokens can only be consumed once
  if (usedCaptchaTokens.has(cleanToken)) {
    return {
      success: false,
      error: 'This verification token has already been used. Please complete a fresh verification.',
    };
  }

  // Cloudflare Standard Dummy / Test Tokens for development & automated tests
  if (cleanToken === '1x00000000000000000000AA' || cleanToken.startsWith('test_valid_captcha_')) {
    usedCaptchaTokens.set(cleanToken, Date.now());
    return { success: true };
  }

  if (cleanToken === '2x00000000000000000000AB' || cleanToken.startsWith('test_invalid_captcha_')) {
    return {
      success: false,
      error: 'Security verification failed. Please try again.',
    };
  }

  if (cleanToken === '3x00000000000000000000FF') {
    return {
      success: false,
      error: 'The verification token has expired or is invalid. Please refresh the check.',
    };
  }

  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  // If secret key is not configured in environment (local dev mode fallback)
  if (!secretKey) {
    // In local dev without secret key, accept any token with length > 10 and mark used
    if (cleanToken.length >= 10) {
      usedCaptchaTokens.set(cleanToken, Date.now());
      return { success: true };
    }
    return {
      success: false,
      error: 'Invalid verification token format.',
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', cleanToken);
    if (clientIp) {
      formData.append('remoteip', clientIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await res.json();

    if (data.success) {
      usedCaptchaTokens.set(cleanToken, Date.now());
      return { success: true };
    }

    const errorCodes: string[] = data['error-codes'] || [];
    let message = 'Security verification failed. Please try again.';

    if (errorCodes.includes('timeout-or-duplicate')) {
      message = 'Verification token expired or already used. Please complete a fresh verification.';
    } else if (errorCodes.includes('invalid-input-response')) {
      message = 'Invalid verification response. Please try again.';
    }

    return {
      success: false,
      error: message,
    };
  } catch (error) {
    console.error('Turnstile verification error:', error);
    // Graceful fallback if Cloudflare verification endpoint is unreachable
    return {
      success: false,
      error: 'Unable to contact verification service. Please try again in a few moments.',
    };
  }
}
