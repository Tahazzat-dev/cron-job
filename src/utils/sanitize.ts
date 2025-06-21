import validator from 'validator';

export function sanitizeDomain(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  let urlString = raw.trim().toLowerCase();

  // Add default protocol if missing
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = 'https://' + urlString;
  }

  try {
    const parsed = new URL(urlString);
    const domain = parsed.hostname;

    if (!validator.isFQDN(domain, { require_tld: true })) {
      return null;
    }

    return urlString; 
  } catch {
    return null;
  }
}
