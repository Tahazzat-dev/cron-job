import validator from 'validator';

export function sanitizeDomain(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  let urlString = raw.trim().toLowerCase();

  try {
    const parsed = new URL(urlString);
    const domain = parsed.hostname;

    if (!validator.isFQDN(domain, { require_tld: true })) {
      return null;
    }

    return `https://${domain}`; 
  } catch {
    return null;
  }
}


export const createDefaultCronExecutableURL = (rootDomain:string):string=>{
  return rootDomain + '/includes/cron.php'
}