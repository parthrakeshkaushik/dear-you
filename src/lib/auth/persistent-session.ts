/**
 * DEAR YOU — Secure Persistent Session Management (7–14 Days)
 *
 * Implements cryptographically signed, HttpOnly session expiry tracking
 * synchronized with Supabase Auth to guarantee genuine, server-enforced
 * persistent logins without storing sensitive tokens in localStorage.
 */

import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

export const SESSION_COOKIE_NAME = 'dearyou_session_expiry';
export const DURATION_COOKIE_NAME = 'dearyou_remember_duration';
export const DEFAULT_SESSION_DAYS = 14;
export const SUPPORTED_SESSION_DURATIONS = [7, 14] as const;
export type SessionDurationDays = 7 | 14;

/**
 * Derives a strong secret key for signing session tokens.
 */
function getSessionSigningSecret(): Uint8Array {
  const secret =
    process.env.RECIPIENT_JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'dearyou_secure_persistent_session_secret_2026_xyz';
  return new TextEncoder().encode(secret);
}

/**
 * Creates a cryptographically signed session token enforcing exact expiry.
 */
export async function signSessionExpiryToken(
  userId: string,
  days: SessionDurationDays = DEFAULT_SESSION_DAYS
): Promise<{ token: string; expiresAt: number; maxAgeSeconds: number }> {
  const secret = getSessionSigningSecret();
  const maxAgeSeconds = days * 24 * 60 * 60;
  const expiresAt = Date.now() + maxAgeSeconds * 1000;

  const token = await new SignJWT({
    userId,
    days,
    expiresAt,
    issuedAt: Date.now(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(secret);

  return { token, expiresAt, maxAgeSeconds };
}

/**
 * Verifies a signed session token. Checks signature and expiration deadline.
 */
export async function verifySessionExpiryToken(token?: string | null): Promise<{
  valid: boolean;
  userId?: string;
  days?: number;
  expiresAt?: number;
  expired?: boolean;
}> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { valid: false };
  }

  try {
    const secret = getSessionSigningSecret();
    const { payload } = await jwtVerify(token.trim(), secret);

    const expiresAt = Number(payload.expiresAt || 0);
    const userId = payload.userId as string;
    const days = Number(payload.days || DEFAULT_SESSION_DAYS);

    if (Date.now() > expiresAt) {
      return { valid: false, expired: true, userId, days, expiresAt };
    }

    return { valid: true, userId, days, expiresAt };
  } catch (err: any) {
    const isExpired = err?.code === 'ERR_JWT_EXPIRED' || err?.message?.includes('expired');
    return { valid: false, expired: isExpired };
  }
}

/**
 * Sets secure, HttpOnly persistent session cookies on a Next.js response.
 */
export function setSessionCookies(
  response: NextResponse,
  token: string,
  days: SessionDurationDays,
  maxAgeSeconds: number
) {
  const isProd = process.env.NODE_ENV === 'production';

  // 1. Session Expiry Token (HttpOnly, Secure, SameSite=Lax)
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    maxAge: maxAgeSeconds,
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  });

  // 2. Remember Duration Indicator (Readable by browser to configure Supabase client)
  response.cookies.set({
    name: DURATION_COOKIE_NAME,
    value: days.toString(),
    maxAge: maxAgeSeconds,
    path: '/',
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
  });
}

/**
 * Clears all persistent session and Supabase auth cookies on logout or expiry.
 */
export function clearSessionCookies(response: NextResponse) {
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  });

  response.cookies.set({
    name: DURATION_COOKIE_NAME,
    value: '',
    maxAge: 0,
    path: '/',
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
  });
}
