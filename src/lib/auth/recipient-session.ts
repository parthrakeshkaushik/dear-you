import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.RECIPIENT_JWT_SECRET || 'dear-you-recipient-super-secret-key-32-chars-long'
);

const COOKIE_NAME_PREFIX = 'dy_gift_session_';

export interface RecipientJWTPayload {
  giftId: string;
  slug: string;
  iat: number;
  exp: number;
}

export async function createRecipientToken(giftId: string, slug: string): Promise<string> {
  return await new SignJWT({ giftId, slug })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Valid for 7 days
    .sign(JWT_SECRET);
}

export async function verifyRecipientToken(
  token: string,
  expectedGiftId: string
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.giftId === expectedGiftId;
  } catch {
    return false;
  }
}

export function getRecipientCookieName(slug: string): string {
  return `${COOKIE_NAME_PREFIX}${slug}`;
}
