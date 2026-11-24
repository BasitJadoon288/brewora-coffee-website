/** Pictures uploaded from the admin are served by the API under /api/uploads (always forwarded by the Next.js proxy).
 *  Older records may still say /uploads/...; map them so both forms work without any Next.js config. */
export const imgUrl = (src?: string | null) => (src && src.startsWith('/uploads/') ? `/api${src}` : src ?? undefined);
