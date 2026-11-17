// Compact OpenAPI generator: "METHOD /path | Tag | auth | summary". Auth: - public, U user, A admin, O optional
const R = `
POST /api/auth/register|Auth|-|Register customer
POST /api/auth/login|Auth|-|Login (sets refresh cookie)
POST /api/auth/refresh-token|Auth|-|Rotate refresh token
POST /api/auth/logout|Auth|U|Logout
POST /api/auth/forgot-password|Auth|-|Send reset email
POST /api/auth/reset-password|Auth|-|Reset password with token
POST /api/auth/verify-email|Auth|-|Verify email token
POST /api/auth/resend-verification|Auth|U|Resend verification email
POST /api/auth/change-password|Auth|U|Change password
GET /api/auth/profile|Auth|U|Get profile
PUT /api/auth/profile|Auth|U|Update profile
GET /api/products|Catalog|-|List products (q, category, minPrice, maxPrice, sort, page, limit, featured, bestSeller)
GET /api/products/{id}|Catalog|-|Product by id
GET /api/products/slug/{slug}|Catalog|-|Product by slug with related
POST /api/products|Catalog|A|Create product
PUT /api/products/{id}|Catalog|A|Update product
DELETE /api/products/{id}|Catalog|A|Delete product
GET /api/products/{id}/reviews|Reviews|-|List reviews
POST /api/products/{id}/reviews|Reviews|U|Add review
DELETE /api/products/{id}/reviews/{reviewId}|Reviews|U|Delete own review (admin: any)
GET /api/categories|Catalog|-|List active categories
POST /api/categories|Catalog|A|Create category
PUT /api/categories/{id}|Catalog|A|Update category
DELETE /api/categories/{id}|Catalog|A|Delete category
POST /api/cart/quote|Cart|O|Server-side price quote (guest or member)
GET /api/cart|Cart|U|Get cart
POST /api/cart/items|Cart|U|Add item
POST /api/cart/merge|Cart|U|Merge guest cart after login
PUT /api/cart/items/{id}|Cart|U|Update quantity
DELETE /api/cart/items/{id}|Cart|U|Remove item
POST /api/orders|Orders|O|Place order (supports idempotencyKey)
GET /api/orders/my-orders|Orders|U|My orders
GET /api/orders/track/{orderNumber}|Orders|-|Track (needs ?email=)
GET /api/orders/{id}|Orders|U|Order details
POST /api/orders/{id}/cancel|Orders|U|Cancel pending order
POST /api/payments/{orderId}/initiate|Payments|O|Start payment / get bank instructions
POST /api/payments/{orderId}/bank-reference|Payments|O|Submit bank transfer reference
POST /api/payments/jazzcash/callback|Payments|-|JazzCash return/webhook (hash verified)
POST /api/payments/easypaisa/callback|Payments|-|EasyPaisa return/webhook (hash verified)
GET /api/wishlist|Wishlist|U|Get wishlist
POST /api/wishlist/{productId}|Wishlist|U|Add
DELETE /api/wishlist/{productId}|Wishlist|U|Remove
POST /api/wishlist/{productId}/move-to-cart|Wishlist|U|Move to cart
GET /api/addresses|Addresses|U|List
POST /api/addresses|Addresses|U|Create
PUT /api/addresses/{id}|Addresses|U|Update
DELETE /api/addresses/{id}|Addresses|U|Delete
GET /api/notifications|Notifications|U|List
PUT /api/notifications/read-all|Notifications|U|Mark all read
PUT /api/notifications/{id}/read|Notifications|U|Mark read
POST /api/newsletter/subscribe|Newsletter|-|Subscribe
POST /api/coupons/validate|Coupons|-|Validate coupon for a subtotal
GET /api/banners|Content|-|Active banners
GET /api/testimonials|Content|-|Active testimonials
GET /api/content/{key}|Content|-|Page content (about, homepage)
GET /api/settings/public|Content|-|Public store settings
GET /api/admin/dashboard|Admin|A|Dashboard
GET /api/admin/products|Admin|A|All products
GET /api/admin/products/{id}|Admin|A|Product by id (incl. inactive)
GET /api/admin/categories|Admin|A|All categories
GET /api/admin/orders|Admin|A|Orders (q, orderStatus, paymentStatus, from, to)
GET /api/admin/orders/{id}|Admin|A|Order detail
PUT /api/admin/orders/{id}/status|Admin|A|Update status
PUT /api/admin/orders/{id}/payment|Admin|A|Mark COD/bank payment
POST /api/admin/orders/{id}/refund|Admin|A|Record refund
GET /api/admin/orders/{id}/invoice|Admin|A|Printable invoice HTML
GET /api/admin/customers|Admin|A|Customers
GET /api/admin/customers/{id}|Admin|A|Customer profile + orders
PUT /api/admin/customers/{id}/status|Admin|A|Activate/deactivate
GET /api/admin/inventory|Admin|A|Stock list (status=low|out)
PUT /api/admin/inventory/{productId}|Admin|A|Adjust stock
GET /api/admin/inventory/history|Admin|A|Stock history
GET /api/admin/reports|Admin|A|Reports (type, period, from, to, format=csv)
GET /api/admin/analytics|Admin|A|Analytics
POST /api/admin/uploads/sign|Admin|A|Cloudinary signed upload params
GET /api/admin/newsletter|Admin|A|Subscribers
GET /api/admin/settings|Admin|A|Get settings
PUT /api/admin/settings|Admin|A|Update settings
PUT /api/admin/content/{key}|Admin|A|Update page content
POST /api/contact|Content|-|Submit contact form
GET /api/admin/reviews|Admin|A|All reviews (approved=true|false)
PUT /api/admin/reviews/{id}/approval|Admin|A|Approve / hide a review
DELETE /api/admin/reviews/{id}|Admin|A|Delete a review
GET /api/admin/messages|Admin|A|Contact messages (CRUD)
POST /api/admin/uploads/image|Admin|A|Upload an image (raw body, Content-Type image/*, ?folder=)
GET /api/admin/coupons|Admin|A|Coupons (CRUD: GET/POST /, GET/PUT/DELETE /{id})
GET /api/admin/banners|Admin|A|Banners (CRUD)
GET /api/admin/testimonials|Admin|A|Testimonials (CRUD)
`.trim().split('\n');
export const openapi = {
  openapi: '3.0.3', info: { title: 'BREWORA API', version: '1.0.0', description: 'Premium coffee e-commerce API (PKR)' },
  components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: R.reduce((acc: any, line) => {
    const [mp, tag, auth, summary] = line.split('|'); const [method, path] = mp.split(' ');
    (acc[path] ??= {})[method.toLowerCase()] = { tags: [tag], summary, security: auth === '-' ? [] : [{ bearer: [] }],
      parameters: [...path.matchAll(/\{(\w+)\}/g)].map(m => ({ name: m[1], in: 'path', required: true, schema: { type: 'string' } })),
      responses: { '200': { description: 'OK' }, '400': { description: 'Validation error' }, '401': { description: 'Unauthorized' }, '403': { description: 'Forbidden' } } };
    return acc;
  }, {}),
};
