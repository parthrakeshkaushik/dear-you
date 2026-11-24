import { formatDateTimeZone } from '@/lib/utils';

export interface ExpiryCheckResult {
  isExpired: boolean;
  expiresAtFormatted: string;
  remainingSeconds?: number;
}

/**
 * Enforces server-side time verification against UTC timestamps.
 */
export function checkGiftExpiry(
  expiryEnabled: boolean,
  expiresAtUtc?: string | null,
  timeZone: string = 'Asia/Kolkata'
): ExpiryCheckResult {
  if (!expiryEnabled || !expiresAtUtc) {
    return {
      isExpired: false,
      expiresAtFormatted: 'No expiry set (Indefinite)',
    };
  }

  const expiryTimestamp = new Date(expiresAtUtc).getTime();
  const currentTimestamp = Date.now();
  const isExpired = currentTimestamp >= expiryTimestamp;
  const remainingSeconds = Math.max(0, Math.floor((expiryTimestamp - currentTimestamp) / 1000));

  return {
    isExpired,
    expiresAtFormatted: formatDateTimeZone(expiresAtUtc, timeZone),
    remainingSeconds,
  };
}
