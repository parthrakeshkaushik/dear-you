import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.RECIPIENT_JWT_SECRET || 'dear-you-recipient-super-secret-key-32-chars-long'
);

const COOKIE_NAME_PREFIX = 'dy_gift_session_';

export interface RecipientJWTPayload {
  giftId: string;
  slug: string;
  password_version: number;
  iat: number;
  exp: number;
}

/**
 * Creates a cryptographically signed recipient access token bound to a specific
 * card ID, slug, and password_version.
 */
export async function createRecipientToken(
  giftId: string,
  slug: string,
  passwordVersion: number = 1
): Promise<string> {
  return await new SignJWT({
    giftId,
    slug,
    password_version: Number(passwordVersion || 1),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Valid for 7 days unless revoked by password change
    .sign(JWT_SECRET);
}

/**
 * Verifies the recipient access token.
 * If the creator has updated the card password, the card's password_version
 * will have incremented, making any older token immediately invalid and revoked.
 */
export async function verifyRecipientToken(
  token: string,
  expectedGiftId: string,
  expectedPasswordVersion: number = 1
): Promise<{ valid: boolean; passwordRevoked?: boolean }> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.giftId !== expectedGiftId) {
      return { valid: false };
    }

    const tokenVersion = Number((payload as any).password_version || 1);
    const currentVersion = Number(expectedPasswordVersion || 1);

    if (tokenVersion !== currentVersion) {
      return { valid: false, passwordRevoked: true };
    }

    return { valid: true };
  } catch {
    return { valid: false };
  }
}

export function getRecipientCookieName(slug: string): string {
  return `${COOKIE_NAME_PREFIX}${slug}`;
}
