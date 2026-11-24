/**
 * Disposable and throwaway email domain detector.
 * Prevents registration with temporary, disposable, or burner email inboxes.
 */

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'temp-mail.org',
  'temp-mail.com',
  'tempmail.com',
  'tempmail.net',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'pokemail.net',
  'spam4.me',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'dispostable.com',
  'fakeinbox.com',
  'getairmail.com',
  'throwawaymail.com',
  'fakemailgenerator.com',
  'crazymailing.com',
  'generator.email',
  'mohmal.com',
  'mytemp.email',
  'tempmailaddress.com',
  'burnermail.io',
  'inboxkitten.com',
  'emailondeck.com',
  'dropmail.me',
  'getnada.com',
  'abacusmail.com',
  'chacuo.net',
  'disposablemail.com',
  'discard.email',
  'spambog.com',
  'maildrop.cc',
]);

/**
 * Checks whether an email address uses a known disposable or burner domain.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Normalizes email address for consistent comparison and deduplication.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
