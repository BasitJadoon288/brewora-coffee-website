# BREWORA — Premium Coffee E-Commerce (Pakistan, PKR)

One monorepo, two apps:
- `apps/api` — Node.js + Express + TypeScript + MongoDB, **Clean Architecture** (see `docs/ARCHITECTURE.md`).
- `apps/web` — **one Next.js app**: customer website at `/`, Admin Portal at `/admin`.

## Quick start
Requirements: Node.js 20+, MongoDB 6+ (local or Atlas).
```
npm install                                   # once, from the repo root
cd apps/api && cp .env.example .env           # edit: MONGODB_URI, JWT secrets, ADMIN_PASSWORD (min 10 chars)
npm run seed                                  # admin + demo catalog, content, coupons (prints the demo customer password)
npm run dev                                   # API on :4000, Swagger at /api/docs

cd ../web && cp .env.example .env.local
npm run dev                                   # website on :3000, admin on :3000/admin
```
Sign in at `/admin/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the API `.env`.
The browser only talks to the web origin; `/api/*` and `/uploads/*` are proxied to the API (`API_INTERNAL_URL`). Set `CUSTOMER_URL` in the API `.env` to the public site URL.

## What the admin controls (everything on the website)
| Admin page | Controls |
|---|---|
| Dashboard | Live revenue, orders, customers, low stock; daily/weekly/monthly/yearly sales charts |
| Products | Create/edit/hide/delete; images (upload or URL), variants/sizes, specs, prices, discount, stock, featured/best-seller flags |
| Categories | Name, slug, image, visibility |
| Inventory | Stock list, low/out-of-stock filters, adjustments with reason, full stock history (never below zero) |
| Orders | Search/filter, details, status workflow, mark COD/bank payments, refunds, cancel (restocks), printable invoice |
| Customers | Search, profile, order history, spend, activate/deactivate |
| Coupons | Percentage/fixed, minimum order, cap, expiry, usage limit, enable/disable |
| Reviews | Publish/hide/delete (ratings update automatically) |
| Banners / Testimonials | Hero + promo banners, homepage testimonials |
| Pages & content | Homepage (announcement bar, which sections are shown, why-us, story, Instagram gallery, newsletter text), About, FAQ, Contact, Privacy, Terms, Shipping, Returns |
| Messages / Newsletter | Contact-form inbox; subscriber list + CSV |
| Reports / Analytics | Sales, revenue, orders, customers, products — view and CSV export; category/payment/customer analytics |
| Settings | Store name, logo, contact, delivery charges, free-delivery threshold, tax, low-stock level, payment methods on/off, bank details, social links |
Changes to public content refresh the storefront immediately.

## Customer website
Homepage (CMS-driven), shop (search, category, price, sort, best sellers, pagination), product page (variants, quantity, add to cart, buy now, wishlist, reviews, related), cart (guest cart in the browser, merged into the account on login; coupon; server-calculated totals), checkout (COD, bank transfer, JazzCash, EasyPaisa), order confirmation, order tracking (order number + email), register/login/forgot/reset/verify email, account (profile, orders + cancel, addresses, wishlist, password), About/Contact/FAQ/policies, sitemap + robots.

## Tests
- API: `cd apps/api && npm test` → 38 tests (unit, an architecture test that enforces the dependency rule, and API tests against a real MongoDB — set `TEST_MONGODB_URI`; **that database is dropped**).
- Web: `cd apps/web && npm test` → 16 tests (cart logic, API client token refresh, admin route guard, forms).
- Also verified end-to-end against the production builds: all routes return 200, a scripted customer + admin journey (register, cart, coupon, COD & bank orders, cancel/restock, image upload, product create/edit, content edit) passes 39/39.

## Payments
COD and bank transfer work end-to-end. JazzCash/EasyPaisa only mark an order paid after a hash-verified provider callback with matching amount; without credentials the order stays pending and the customer is told payment is unavailable. See `docs/PAYMENTS.md`.

## Production notes
`npm run build && npm start` in each app. Use HTTPS, set `NODE_ENV=production`, real secrets, SMTP (emails are only logged otherwise), and persistent storage for `UPLOAD_DIR` (uploaded images live on disk; swap `LocalDiskImageStorage` for S3/Cloudinary storage if your host is ephemeral).

## Known limitations (read before launch)
- **Not checked in a real browser.** No browser was available while building, so layout, responsiveness and visual polish were not visually verified. Behaviour was verified through jsdom tests, production builds and HTTP-level journeys. Please click through the site once.
- No product/brand photos are bundled. Seed products show a branded placeholder until the admin uploads images (Admin → Products).
- Policy, FAQ and About texts are generic templates — have them reviewed for your business/legal needs.
- JazzCash/EasyPaisa were tested only with simulated, correctly-signed callbacks (no sandbox credentials). EasyPaisa's hash scheme is generic; align it with your merchant documentation.
- Refunds are recorded in BREWORA; money must be returned through your bank/provider.
- Only the seeded admin exists; there is no screen yet to create more admin accounts.
- Instagram gallery is manual (admin adds photos); there is no live Instagram feed. Stock is per product (variants are price options only).
