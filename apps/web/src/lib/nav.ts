/** Only same-site relative paths are allowed as post-login redirects (prevents open redirects). */
export const safeNext = (v: string | null | undefined, fallback = '/account') => (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') ? v : fallback);
