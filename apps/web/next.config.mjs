const API = (process.env.API_INTERNAL_URL || 'http://localhost:4000').replace(/\/+$/, '');
// Rewrites are baked in at BUILD time. On Vercel a missing API_INTERNAL_URL would silently point at localhost, so fail loudly instead.
if (process.env.VERCEL && !process.env.API_INTERNAL_URL) throw new Error('API_INTERNAL_URL is not set. Add it in Vercel > Settings > Environment Variables (your API URL, e.g. https://brewora-api.vercel.app) and redeploy.');
/** The browser only talks to this origin; /api and /uploads are proxied to the Express API (keeps the httpOnly refresh cookie same-origin). */
export default { reactStrictMode: true, poweredByHeader: false, async rewrites() { return [{ source: '/api/:path*', destination: `${API}/api/:path*` }, { source: '/uploads/:path*', destination: `${API}/uploads/:path*` }]; } };
