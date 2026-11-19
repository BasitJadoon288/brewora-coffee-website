# Performance review — what was found and what changed

After unzipping, run `npm install` once (two packages were added: `compression`, `@types/compression`; `bcrypt` is an *optional* native speed-up).

## Issues found → fix

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | `settings.get()` did an **upsert (a DB write) on every read**; it is called on every quote, checkout, inventory list, dashboard, invoice | A write + round trip on almost every request | Plain read + 15 s in-process cache with in-flight de-duplication; cache is cleared immediately on settings update (`shared/infrastructure/cache.ts`) |
| 2 | **Cart merge N+1**: each guest line ran add-item (cart read, product read with populate, cart write, full cart view = ~5 queries) | 100 items ≈ 500 queries | One cart read, one product read, one write, one view. Verified identical output to the old algorithm on 3000 random scenarios |
| 3 | Cart add/update/remove re-read the cart right after saving it | +1 query per cart call | `CartViewBuilder.build(userId, savedCart)` reuses the saved document |
| 4 | **Missing indexes**: orders (`createdAt`, `paymentStatus`, verified-purchase lookup), users (`role+createdAt`, `resetTokenHash`, `emailVerifyHash` → collection scans), inventory ledger (`orderId`, `productId+createdAt`), reviews, notifications, products (newest / popular / featured / best-seller / stock), banners | Collection scans on hot paths | Indexes added in the models (built automatically by mongoose `autoIndex`) |
| 5 | Unused `text` index on products (search uses regex, never `$text`) | Slower writes, extra storage | Removed from the schema (an existing index in your DB can be dropped manually: `db.products.dropIndex('name_text_description_text')`) |
| 6 | Dashboard ran **17 queries** (4 separate sales aggregations, 3 separate counts) — with a pool of 5 on Vercel they queue | Slow admin home | 11 queries: counts derived from the status breakdown; the 4 sales series come from a single `$facet` aggregation; recent orders / latest customers fetch only the displayed fields |
| 7 | `salesByCategory` ran a `$lookup` for **every order line** | Slow analytics, grows with order history | Group lines per product first, then join products/categories |
| 8 | Checkout, stock reservation, order cancel and compensation were fully **sequential** (one await per line / per write) | Latency grows with cart size | Reservations and independent writes run concurrently with `Promise.allSettled` so compensation can never race a late write; cancel writes one bulk ledger insert |
| 9 | Independent awaits chained one after another (quote: products → settings → coupon; order detail; invoice; refresh-token; customer profile; add review; mark payment; refund) | Extra round trips | `Promise.all` (error precedence unchanged) |
| 10 | Internal callers loaded products **with category populate** (extra query) | +1 query on cart add, wishlist add, review, product update | `findById(id, activeOnly, withCategory=false)` for internal use |
| 11 | `countDocuments({})` for unfiltered pages / dashboard | Counts every document | `estimatedDocumentCount()` (`countFast`) |
| 12 | Static `/uploads` images went through json/cookie/sanitize/rate-limit/**request logging** | Wasted CPU + log noise per image | Mounted before those middlewares; `Cache-Control: max-age=30d, immutable` (file names are UUIDs) |
| 13 | No HTTP caching/compression for public storefront data | Every visit hits Mongo and sends full JSON | `Cache-Control` (+ `s-maxage` / stale-while-revalidate) on categories, banners, testimonials, content, public settings (60 s) and products (30 s); never on errors. gzip via `compression` when self-hosted (Vercel compresses on its own) |
| 14 | `bcryptjs` (pure JS) at cost 12 blocks the event loop for ~250 ms per login/register | Whole server stalls during logins | Uses native `bcrypt` (thread pool) automatically if installed, else falls back to `bcryptjs`; same hash format |
| 15 | Swagger UI loaded on every serverless cold start | Slower cold start | Lazy `require`, only when not on Vercel |
| 16 | `fromMongo` used `Object.entries()` (allocates per field) on every document | CPU on large lists | `for…in` loop |
| 17 | Mongo connection tuning | | explicit `maxPoolSize` / `minPoolSize` / `maxIdleTimeMS` |
| 18 | `markAllRead` updated already-read notifications | Needless writes | Filter on `isRead: false` |

## Not changed (worth knowing)

* Product / order / customer **search uses unanchored case-insensitive regex** — MongoDB cannot use an index for that. If the catalog grows large, switch to a text index or Atlas Search.
* `uploads/` holds ~16 MB of full-size JPEGs. Compressing/resizing them (or using Cloudinary, which is already wired for signing) will help page load far more than any backend change.
* Settings and public lists may now be up to 15–60 s stale on *other* serverless instances after an admin edit (the instance that handled the edit is updated immediately).
* `.env` is included in the zip exactly as you sent it — do not share the archive publicly and rotate secrets if it was shared.

---

# Emails + OTP (added later)

* **E-mail verification and password reset now send a 6-digit OTP** (valid 10 minutes, hashed in the DB, single use, locked after 5 wrong tries, resend/forgot limited to 1 per minute). The old link is still included as a button, so the existing frontend pages keep working.
* `POST /api/auth/verify-email` accepts `{ "email", "otp" }` (or the old `{ "token" }`).
* `POST /api/auth/reset-password` accepts `{ "email", "otp", "password" }` (or the old `{ "token", "password" }`).
* `POST /api/auth/forgot-password` and `/resend-verification` are unchanged.
* All 4 e-mails (verify, reset, order confirmation with item table and totals, order status updates with friendly text per status) now use branded HTML templates: `src/shared/application/email-templates.ts`. A plain-text version is attached automatically.
* The frontend needs a screen where the customer types the 6-digit code (see the API shapes above).
