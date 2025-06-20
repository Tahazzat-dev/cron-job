import validator from 'validator';

export function sanitizeDomain(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  let domain = raw.trim().toLowerCase();

  // Validate domain using validator.js
  if (!validator.isFQDN(domain, { require_tld: true })) {
    return null;
  }

  return domain;
}
