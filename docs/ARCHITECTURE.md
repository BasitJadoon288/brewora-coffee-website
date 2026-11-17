# BREWORA API — Clean Architecture

## Layers and the dependency rule
Dependencies point inward only. This is enforced by an automated test (`tests/architecture.test.ts`) that scans the real import graph.

| Layer | Contains | May import |
|---|---|---|
| **domain** | Entities, value rules (pricing, coupon, order state machine), repository **interfaces** | domain only, no packages |
| **application** | Use cases, DTOs (Zod), ports to external services (Mailer, TokenService, PaymentGateway, UploadSigner, Notifier) | domain, application, `zod` |
| **infrastructure** | Mongoose models, repository implementations, bcrypt/JWT/nodemailer/Cloudinary, JazzCash/EasyPaisa gateways | domain, application, any package |
| **presentation** | Express controllers, routes, middleware (thin: parse, call a use case, respond) | domain, application, `express`, `zod` |

The **composition root** (`src/container.ts`, with `app.ts`, `bootstrap.ts`, `server.ts`, `scripts/seed.ts`) is the only place that wires concrete classes to interfaces (manual constructor injection, no framework).

## Layout
```
src/
  shared/            domain (errors, pagination, ids, text) · application (ports, generic CRUD use case)
                     infrastructure (env, logger, mongo mapper, mailer, hasher, JWT) · presentation (http helpers, auth guards, error handler, csv)
  modules/<name>/{domain,application,infrastructure,presentation}
    identity   users, sessions (rotating refresh tokens), password reset, e-mail verification
    catalog    products, categories, inventory ledger
    settings   store settings (singleton)
    promotions coupons
    pricing    server-side quote (single source of truth for prices)
    cart       server cart, guest-cart merge
    orders     orders, payments (records), state machine, refunds, tracking
    payments   gateway flow: initiate, bank reference, verified callbacks
    engagement wishlist, reviews, addresses, notifications, newsletter
    content    banners, testimonials, page content
    reporting  read-side queries: dashboard, reports, analytics, customers
    uploads    Cloudinary signed uploads
  container.ts · app.ts · bootstrap.ts · server.ts · scripts/seed.ts · docs/openapi.ts
```

## Conventions
- Entities are plain objects with `id` (string). Repositories map Mongo documents to entities (`fromMongo`), never leak `_id`, ObjectId or credentials, and translate driver errors (duplicate key, cast) into domain errors.
- Use cases receive interfaces via constructor and throw **domain errors** (`NotFoundError`, `ConflictError`, ...). Only the presentation layer maps them to HTTP status codes.
- Cross-aggregate reads (dashboard, reports) go through a dedicated read-side port (`ReportingRepository`) instead of bloating aggregate repositories.
- Order placement is a compensating workflow (atomic stock reservation → coupon → order/payment/ledger; everything is rolled back on failure). MongoDB transactions are not required.

## Adding a feature
1. Entity + repository interface in `domain/`. 2. DTO + use case in `application/`. 3. Mongoose model + repository in `infrastructure/`. 4. Controller + routes in `presentation/`. 5. Wire it in `container.ts` and mount in `app.ts`. 6. Add the endpoint to `docs/openapi.ts` and a test.

## Web app (`apps/web`)
Next.js 14 App Router, Tailwind, TanStack Query. One app, two areas:
- `app/(site)/…` customer pages (server components for SEO: home, shop, product, CMS pages; client components for cart, checkout, auth, account).
- `app/admin/login` and `app/admin/(portal)/…` admin portal behind a client-side guard (UX only — every admin API call is authorised by the Express API).
- `lib/api.ts` API client (in-memory access token, rotating httpOnly refresh cookie, one in-flight refresh); `lib/cart.tsx` guest + server cart; `lib/server.ts` server-side data access with CMS defaults.
- `components/admin/ResourcePage.tsx` is a generic CRUD screen (categories, coupons, banners, testimonials); products, orders, inventory, settings and the content editor have dedicated screens.
- Public content is cached (ISR 30 s) and refreshed on demand: the admin UI calls `POST /revalidate` (admin-verified) after saving public content.
- Admin-entered text is rendered as plain paragraphs, never as HTML.
