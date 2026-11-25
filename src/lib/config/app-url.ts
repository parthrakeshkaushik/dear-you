/**
 * DEAR YOU — Central Application URL and Domain Resolution
 *
 * Enforces strict environment separation between production deployments
 * and local development, preventing localhost leaks in production emails.
 */

export const PRODUCTION_DOMAIN = 'dear-you-wine.vercel.app';
export const PRODUCTION_BASE_URL = 'https://dear-you-wine.vercel.app';
export const LOCAL_DEV_BASE_URL = 'http://localhost:3000';

/**
 * Returns true only if the runtime environment is explicitly local development
 * AND the incoming request or configuration explicitly targets localhost/127.0.0.1.
 */
export function isExplicitLocalDev(request?: Request): boolean {
  // Never treat production environments (Vercel, NODE_ENV=production) as local
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    return false;
  }

  // Only allow local development URL if we are in development mode AND
  // developer explicitly opted into local redirect via ALLOW_LOCAL_AUTH_REDIRECT=true
  if (process.env.ALLOW_LOCAL_AUTH_REDIRECT === 'true' && request) {
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      host.includes('localhost') ||
      host.includes('127.0.0.1')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Resolves the trusted application base URL:
 * - In production (or whenever in doubt): ALWAYS returns canonical production URL 'https://dear-you-wine.vercel.app'.
 * - In local development: returns 'http://localhost:3000' ONLY when explicitly configured.
 */
export function getAppBaseUrl(request?: Request): string {
  // 1. Explicit local dev check
  if (isExplicitLocalDev(request)) {
    return LOCAL_DEV_BASE_URL;
  }

  // 2. Production URL configuration
  // Check NEXT_PUBLIC_APP_URL first, but ensure it NEVER uses localhost in production
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (
    configuredAppUrl &&
    !configuredAppUrl.includes('localhost') &&
    !configuredAppUrl.includes('127.0.0.1')
  ) {
    return configuredAppUrl.replace(/\/+$/, '');
  }

  // 3. Vercel deployment URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, '')}`;
  }

  // 4. Default to canonical production URL
  return PRODUCTION_BASE_URL;
}

/**
 * Resolves the trusted Password Reset URL:
 * Guarantees https://dear-you-wine.vercel.app/reset-password for production.
 */
export function getResetPasswordUrl(request?: Request): string {
  const baseUrl = getAppBaseUrl(request);
  return `${baseUrl}/reset-password`;
}

/**
 * Resolves the trusted Auth Callback URL:
 */
export function getAuthCallbackUrl(request?: Request): string {
  const baseUrl = getAppBaseUrl(request);
  return `${baseUrl}/auth/callback`;
}
