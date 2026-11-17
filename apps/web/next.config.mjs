const API = process.env.API_INTERNAL_URL || 'http://localhost:4000';
/** The browser only talks to this origin; /api and /uploads are proxied to the Express API (keeps the httpOnly refresh cookie same-origin). */
export default { reactStrictMode: true, async rewrites() { return [{ source: '/api/:path*', destination: `${API}/api/:path*` }, { source: '/uploads/:path*', destination: `${API}/uploads/:path*` }]; } };
