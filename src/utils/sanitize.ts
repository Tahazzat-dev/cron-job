import validator from 'validator';

export function sanitizeDomain(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  let domain = raw.trim().toLowerCase();

  // Remove protocol if user included it
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    try {
      const parsed = new URL(domain);
      domain = parsed.hostname;
    } catch (e) {
      return null;
    }
  }

  // Validate domain using validator.js
  if (!validator.isFQDN(domain, { require_tld: true })) {
    return null;
  }

  return domain;
}
