import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { jazzSecureHash } from '../src/modules/payments/infrastructure/signing';

Object.assign(process.env, {
  UPLOAD_DIR: require('os').tmpdir() + '/brewora-test-uploads',
  NODE_ENV: 'test', MONGODB_URI: process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27018/brewora_test',
  JWT_ACCESS_SECRET: 'test-access-secret-123456', JWT_REFRESH_SECRET: 'test-refresh-secret-123456',
  CUSTOMER_URL: 'http://localhost:3000', ADMIN_URL: 'http://localhost:3001', API_URL: 'http://localhost:4000',
  JAZZCASH_MERCHANT_ID: 'MC1', JAZZCASH_PASSWORD: 'pw', JAZZCASH_INTEGRITY_SALT: 'salt123',
});
let api: any; let admin = ''; let cust = ''; let custCookie: string[] = [];
let cat: any; let prod: any; let prod2: any;
const A = (t: string) => ({ Authorization: `Bearer ${t}` });
const shipping = { line1: 'House 1, Street 2, DHA', city: 'Karachi', postalCode: '75500' };
const customer = { fullName: 'Test Buyer', email: 'buyer@example.com', phone: '03001234567' };
const order = (over: any = {}) => api.post('/api/orders').set(A(cust)).send({ items: [{ productId: prod.id, quantity: 2 }], paymentMethod: 'COD', customer, shippingAddress: shipping, ...over });
const stock = async (id: string) => (await mongoose.connection.collection('products').findOne({ _id: new mongoose.Types.ObjectId(id) }))!.stockQuantity;

beforeAll(async () => {
  const { createApplication } = await import('../src/bootstrap'); const { connectDatabase } = await import('../src/shared/infrastructure/mongo');
  const { app, container } = createApplication(); api = request(app);
  await mongoose.connect(process.env.MONGODB_URI!); await mongoose.connection.dropDatabase(); await connectDatabase(process.env.MONGODB_URI!);
  await container.repos.users.create({ fullName: 'Admin', email: 'admin@test.pk', passwordHash: await container.services.hasher.hash('AdminPass123'), role: 'Admin', isEmailVerified: true });
  admin = (await api.post('/api/auth/login').send({ email: 'admin@test.pk', password: 'AdminPass123' })).body.accessToken;
});
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

describe('auth', () => {
  it('registers, rejects duplicates and weak passwords', async () => {
    expect((await api.post('/api/auth/register').send({ fullName: 'Test Buyer', email: 'buyer@example.com', password: 'weak' })).status).toBe(400);
    const r = await api.post('/api/auth/register').send({ fullName: 'Test Buyer', email: 'buyer@example.com', password: 'Buyer12345' });
    expect(r.status).toBe(201); expect(r.body.user.passwordHash).toBeUndefined(); expect(r.body.user.role).toBe('Customer');
    expect((await api.post('/api/auth/register').send({ fullName: 'Test Buyer', email: 'buyer@example.com', password: 'Buyer12345' })).status).toBe(409);
  });
  it('login failure is generic; success returns token + refresh cookie', async () => {
    expect((await api.post('/api/auth/login').send({ email: 'buyer@example.com', password: 'Wrong12345' })).status).toBe(401);
    const r = await api.post('/api/auth/login').send({ email: 'buyer@example.com', password: 'Buyer12345' });
    cust = r.body.accessToken; custCookie = r.headers['set-cookie']; expect(custCookie[0]).toMatch(/HttpOnly/);
  });
  it('refresh rotates and reuse of old token is rejected', async () => {
    const r1 = await api.post('/api/auth/refresh-token').set('Cookie', custCookie);
    expect(r1.status).toBe(200);
    const reuse = await api.post('/api/auth/refresh-token').set('Cookie', custCookie);
    expect(reuse.status).toBe(401);
    const again = await api.post('/api/auth/refresh-token').set('Cookie', r1.headers['set-cookie']);
    expect(again.status).toBe(401); // session revoked after reuse
    const l = await api.post('/api/auth/login').send({ email: 'buyer@example.com', password: 'Buyer12345' }); cust = l.body.accessToken;
  });
  it('enforces authentication and role-based access', async () => {
    expect((await api.get('/api/auth/profile')).status).toBe(401);
    expect((await api.get('/api/admin/dashboard').set(A(cust))).status).toBe(403);
    expect((await api.get('/api/admin/dashboard')).status).toBe(401);
    expect((await api.post('/api/products').set(A(cust)).send({})).status).toBe(403);
  });
  it('forgot/reset password does not leak existence', async () => {
    expect((await api.post('/api/auth/forgot-password').send({ email: 'nobody@example.com' })).status).toBe(200);
    expect((await api.post('/api/auth/reset-password').send({ token: 'x'.repeat(20), password: 'NewPass123' })).status).toBe(400);
  });
  it('change password revokes sessions', async () => {
    expect((await api.post('/api/auth/change-password').set(A(cust)).send({ currentPassword: 'bad', newPassword: 'NewPass1234' })).status).toBe(400);
    expect((await api.post('/api/auth/change-password').set(A(cust)).send({ currentPassword: 'Buyer12345', newPassword: 'Buyer12345x' })).status).toBe(200);
    cust = (await api.post('/api/auth/login').send({ email: 'buyer@example.com', password: 'Buyer12345x' })).body.accessToken;
  });
});

describe('catalog', () => {
  it('category + product CRUD (admin only), validation, search/filter/sort/pagination', async () => {
    cat = (await api.post('/api/categories').set(A(admin)).send({ name: 'Latte' })).body; expect(cat.slug).toBe('latte');
    const mk = (o: any) => api.post('/api/products').set(A(admin)).send({ name: 'Vanilla Latte', description: 'd', price: 650, categoryId: cat.id, sku: 'SKU1', stockQuantity: 10, variants: [{ name: 'Large', priceDelta: 200 }], ...o });
    expect((await mk({ discountPrice: 700 })).status).toBe(400);
    prod = (await mk({ discountPrice: 590 })).body; expect(prod.slug).toBe('vanilla-latte');
    prod2 = (await mk({ name: 'Cold Brew', sku: 'SKU2', price: 600, stockQuantity: 5, isBestSeller: true })).body;
    expect((await mk({ sku: 'SKU2', name: 'Other' })).status).toBe(409);
    const list = await api.get('/api/products?sort=price_asc&limit=1&page=2');
    expect(list.body.total).toBe(2); expect(list.body.items[0].name).toBe('Vanilla Latte');
    expect((await api.get('/api/products?q=cold')).body.total).toBe(1);
    expect((await api.get('/api/products?bestSeller=true')).body.total).toBe(1);
    expect((await api.get('/api/products?minPrice=620')).body.total).toBe(1);
    expect((await api.get('/api/products/slug/cold-brew')).body.name).toBe('Cold Brew');
    const upd = await api.put(`/api/products/${prod2.id}`).set(A(admin)).send({ price: 620, stockQuantity: 8 });
    expect(upd.body.price).toBe(620); expect(upd.body.stockQuantity).toBe(8);
    expect((await api.delete(`/api/categories/${cat.id}`).set(A(admin))).status).toBe(409);
    expect((await api.get('/api/products/not-an-id')).status).toBe(400);
    expect((await api.get('/api/products?q[$ne]=x')).status).toBeLessThan(500);
  });
});

describe('cart', () => {
  it('server cart, stock limits, guest merge', async () => {
    expect((await api.post('/api/cart/items').set(A(cust)).send({ productId: prod.id, quantity: 99 })).status).toBe(400);
    expect((await api.post('/api/cart/items').set(A(cust)).send({ productId: prod.id, quantity: 11 })).status).toBe(409);
    const c = await api.post('/api/cart/items').set(A(cust)).send({ productId: prod.id, quantity: 2, variant: 'Large' });
    expect(c.body.subTotal).toBe(1580);
    const id = c.body.items[0].id;
    expect((await api.put(`/api/cart/items/${id}`).set(A(cust)).send({ quantity: 3 })).body.subTotal).toBe(2370);
    const m = await api.post('/api/cart/merge').set(A(cust)).send({ items: [{ productId: prod2.id, quantity: 50 }] });
    expect(m.body.items.length).toBe(2); expect(m.body.items[1].quantity).toBe(8); // clamped to available stock
    expect((await api.delete(`/api/cart/items/${id}`).set(A(cust))).body.items.length).toBe(1);
  });
  it('quote ignores any client price and applies coupon', async () => {
    await api.post('/api/admin/coupons').set(A(admin)).send({ code: 'save10', discountType: 'Percentage', discountValue: 10, minimumOrderAmount: 1000, usageLimit: 1 });
    const q = await api.post('/api/cart/quote').send({ items: [{ productId: prod.id, quantity: 2 }], couponCode: 'SAVE10', price: 1 });
    expect(q.body.subTotal).toBe(1180); expect(q.body.discount).toBe(118); expect(q.body.deliveryCharges).toBe(200); expect(q.body.totalAmount).toBe(1262);
    expect((await api.post('/api/cart/quote').send({ items: [{ productId: prod.id, quantity: 1 }], couponCode: 'SAVE10' })).status).toBe(400);
  });
});

describe('orders', () => {
  let o1: any;
  it('creates order: server totals, snapshot, stock decrement, inventory log, coupon use, cart cleared', async () => {
    const r = await order({ couponCode: 'SAVE10', idempotencyKey: 'idem-key-0001' });
    expect(r.status).toBe(201); o1 = r.body.order;
    expect(o1.totalAmount).toBe(1262); expect(o1.items[0].name).toBe('Vanilla Latte'); expect(o1.items[0].unitPrice).toBe(590); expect(o1.orderNumber).toMatch(/^BRW-/);
    expect(o1.paymentStatus).toBe('Pending'); expect(o1.statusHistory.length).toBe(1);
    expect(await stock(prod.id)).toBe(8);
    expect((await api.get('/api/cart').set(A(cust))).body.items.length).toBe(0);
    const inv = await api.get(`/api/admin/inventory/history?productId=${prod.id}`).set(A(admin)); expect(inv.body.items.some((i: any) => i.change === -2)).toBe(true);
  });
  it('duplicate submission with same idempotency key returns the same order', async () => {
    const [a, b] = await Promise.all([order({ idempotencyKey: 'idem-key-race' }), order({ idempotencyKey: 'idem-key-race' })]);
    expect(a.body.order.id).toBe(b.body.order.id);
    const again = await order({ idempotencyKey: 'idem-key-0001' }); expect(again.body.duplicate).toBe(true);
    expect(await stock(prod.id)).toBe(6); // 10 -2 -2 only once for the race key
  });
  it('coupon usage limit and overselling are blocked, stock never negative', async () => {
    expect((await order({ couponCode: 'SAVE10' })).status).toBeGreaterThanOrEqual(400);
    const before = await stock(prod.id);
    const results = await Promise.all(Array.from({ length: 6 }, () => order({ items: [{ productId: prod.id, quantity: 2 }] })));
    const ok = results.filter(r => r.status === 201).length;
    expect(ok).toBe(Math.floor(before / 2)); expect(await stock(prod.id)).toBe(before - ok * 2); expect(await stock(prod.id)).toBeGreaterThanOrEqual(0);
  });
  it('validates input, hides other users orders, supports tracking with email', async () => {
    expect((await order({ customer: { ...customer, phone: '123' } })).status).toBe(400);
    const other = await api.post('/api/auth/register').send({ fullName: 'Other Person', email: 'o@example.com', password: 'Other12345' });
    expect((await api.get(`/api/orders/${o1.id}`).set(A(other.body.accessToken))).status).toBe(404);
    expect((await api.get(`/api/orders/${o1.id}`).set(A(cust))).status).toBe(200);
    expect((await api.get(`/api/orders/track/${o1.orderNumber}?email=buyer@example.com`)).body.orderStatus).toBe('Pending');
    expect((await api.get(`/api/orders/track/${o1.orderNumber}?email=x@example.com`)).status).toBe(404);
    expect((await api.get('/api/orders/my-orders').set(A(cust))).body.total).toBeGreaterThan(0);
  });
  it('status machine, history, and cancellation restocks', async () => {
    const r = await api.post('/api/orders').set(A(cust)).send({ items: [{ productId: prod2.id, quantity: 3 }], paymentMethod: 'COD', customer, shippingAddress: shipping }); const o = r.body.order;
    const base = await stock(prod2.id);
    expect((await api.put(`/api/admin/orders/${o.id}/status`).set(A(admin)).send({ status: 'Delivered' })).status).toBe(409);
    for (const s of ['Confirmed', 'Processing', 'Shipped']) expect((await api.put(`/api/admin/orders/${o.id}/status`).set(A(admin)).send({ status: s })).status).toBe(200);
    expect((await api.put(`/api/admin/orders/${o.id}/status`).set(A(admin)).send({ status: 'Cancelled' })).status).toBe(409);
    const d = await api.put(`/api/admin/orders/${o.id}/status`).set(A(admin)).send({ status: 'Delivered' });
    expect(d.body.paymentStatus).toBe('Paid'); expect(d.body.statusHistory.length).toBe(5);
    const r2 = (await api.post('/api/orders').set(A(cust)).send({ items: [{ productId: prod2.id, quantity: 2 }], paymentMethod: 'COD', customer, shippingAddress: shipping })).body.order;
    expect(await stock(prod2.id)).toBe(base - 2);
    expect((await api.post(`/api/orders/${r2.id}/cancel`).set(A(cust))).body.orderStatus).toBe('Cancelled');
    expect(await stock(prod2.id)).toBe(base);
    const rf = await api.post(`/api/admin/orders/${o.id}/refund`).set(A(admin)).send({ amount: 100 }); expect(rf.body.paymentStatus).toBe('Refunded');
  });
});

describe('payments', () => {
  let po: any; let fields: any;
  it('online methods are unavailable until enabled; no fake success', async () => {
    expect((await order({ paymentMethod: 'JazzCash' })).status).toBe(400);
    await api.put('/api/admin/settings').set(A(admin)).send({ paymentMethods: { JazzCash: true }, bank: { bankName: 'HBL', accountTitle: 'BREWORA', accountNumber: '1234', iban: 'PK00', instructions: 'ref' } });
    const r = await order({ paymentMethod: 'JazzCash', items: [{ productId: prod2.id, quantity: 1 }] }); po = r.body.order;
    expect(po.paymentStatus).toBe('Pending');
    expect((await api.put(`/api/admin/orders/${po.id}/payment`).set(A(admin)).send({ status: 'Paid' })).status).toBe(403);
    fields = (await api.post(`/api/payments/${po.id}/initiate`).set(A(cust))).body.fields; expect(fields.pp_SecureHash).toBeTruthy();
  });
  it('callback: bad hash, wrong amount and failure do not mark paid; valid one does (idempotent)', async () => {
    const cb = (p: any, hash = true) => api.post('/api/payments/jazzcash/callback').type('form').send({ ...p, ...(hash && { pp_SecureHash: jazzSecureHash(p, 'salt123') }) });
    const paid = async () => (await api.get(`/api/orders/${po.id}`).set(A(cust))).body.paymentStatus;
    const good = { pp_TxnRefNo: fields.pp_TxnRefNo, pp_Amount: String(Math.round(po.totalAmount * 100)), pp_ResponseCode: '000' };
    await cb(good, false); expect(await paid()).toBe('Pending');
    await api.post('/api/payments/jazzcash/callback').type('form').send({ ...good, pp_SecureHash: 'BAD' }); expect(await paid()).toBe('Pending');
    await cb({ ...good, pp_Amount: '100' }); expect(await paid()).toBe('Pending');
    const ok = await cb(good); expect(ok.status).toBe(302); expect(await paid()).toBe('Paid');
    await cb({ ...good, pp_ResponseCode: '124' }); expect(await paid()).toBe('Paid');
    expect((await api.get(`/api/orders/${po.id}`).set(A(cust))).body.orderStatus).toBe('Confirmed');
  });
  it('failed gateway response marks payment failed, not paid', async () => {
    const o = (await order({ paymentMethod: 'JazzCash', items: [{ productId: prod2.id, quantity: 1 }] })).body.order;
    const f = (await api.post(`/api/payments/${o.id}/initiate`).set(A(cust))).body.fields;
    const p = { pp_TxnRefNo: f.pp_TxnRefNo, pp_Amount: String(Math.round(o.totalAmount * 100)), pp_ResponseCode: '124' };
    await api.post('/api/payments/jazzcash/callback').type('form').send({ ...p, pp_SecureHash: jazzSecureHash(p, 'salt123') });
    expect((await api.get(`/api/orders/${o.id}`).set(A(cust))).body.payment.paymentStatus).toBe('Failed');
  });
  it('bank transfer: instructions, reference stays pending until admin verifies', async () => {
    const o = (await order({ paymentMethod: 'BankTransfer', items: [{ productId: prod2.id, quantity: 1 }] })).body.order;
    expect((await api.post(`/api/payments/${o.id}/initiate`).set(A(cust))).body.bank.bankName).toBe('HBL');
    const r = await api.post(`/api/payments/${o.id}/bank-reference`).set(A(cust)).send({ reference: 'TXN123456' }); expect(r.body.paymentStatus).toBe('Pending');
    expect((await api.get(`/api/orders/${o.id}`).set(A(cust))).body.paymentStatus).toBe('Pending');
    expect((await api.put(`/api/admin/orders/${o.id}/payment`).set(A(admin)).send({ status: 'Paid' })).body.paymentStatus).toBe('Paid');
  });
});

describe('inventory, admin, content', () => {
  it('adjustments never go negative and are logged', async () => {
    const bad = await api.put(`/api/admin/inventory/${prod2.id}`).set(A(admin)).send({ change: -9999, reason: 'oops' }); expect(bad.status).toBe(409);
    const ok = await api.put(`/api/admin/inventory/${prod2.id}`).set(A(admin)).send({ set: 3, reason: 'Recount' }); expect(ok.body.balanceAfter).toBe(3);
    expect((await api.get('/api/admin/inventory?status=low').set(A(admin))).body.items.some((i: any) => i.name === 'Cold Brew')).toBe(true);
  });
  it('dashboard is computed from the database', async () => {
    const d = (await api.get('/api/admin/dashboard').set(A(admin))).body;
    const paid = await mongoose.connection.collection('orders').aggregate([{ $match: { paymentStatus: { $in: ['Paid', 'Refunded'] } } }]).toArray();
    expect(d.cards.totalOrders).toBe(await mongoose.connection.collection('orders').countDocuments());
    expect(d.cards.totalCustomers).toBe(2); expect(d.cards.totalProducts).toBe(2); expect(d.charts.daily.length).toBeGreaterThan(0); expect(d.recentOrders.length).toBeGreaterThan(0); expect(paid.length).toBeGreaterThan(0);
  });
  it('reports (json/csv), customers, invoice, analytics', async () => {
    const csv = await api.get('/api/admin/reports?type=orders&format=csv').set(A(admin)); expect(csv.headers['content-type']).toMatch(/csv/); expect(csv.text.split('\n')[0]).toContain('orderNumber');
    expect((await api.get('/api/admin/reports?type=sales&period=weekly').set(A(admin))).body.rows[0].period).toMatch(/^\d{4}-W\d{2}$/);
    expect((await api.get('/api/admin/reports?type=nope').set(A(admin))).status).toBe(400);
    const cs = await api.get('/api/admin/customers?q=buyer').set(A(admin)); expect(cs.body.items[0].orders).toBeGreaterThan(0);
    const oid = (await api.get('/api/admin/orders').set(A(admin))).body.items[0].id;
    expect((await api.get(`/api/admin/orders/${oid}/invoice`).set(A(admin))).text).toContain('Invoice BRW-');
    expect((await api.get('/api/admin/analytics').set(A(admin))).body.salesByCategory.length).toBeGreaterThan(0);
    expect((await api.put(`/api/admin/customers/${cs.body.items[0].id}/status`).set(A(admin)).send({ isActive: false })).body.isActive).toBe(false);
    expect((await api.post('/api/auth/login').send({ email: 'buyer@example.com', password: 'Buyer12345x' })).status).toBe(403);
  });
  it('wishlist, reviews, addresses, newsletter, content, settings', async () => {
    const u = await api.post('/api/auth/register').send({ fullName: 'Wish List', email: 'w@example.com', password: 'Wish123456' }); const t = u.body.accessToken;
    expect((await api.post(`/api/wishlist/${prod2.id}`).set(A(t))).body.products.length).toBe(1);
    expect((await api.post(`/api/wishlist/${prod2.id}/move-to-cart`).set(A(t))).body.items.length).toBe(1);
    expect((await api.get('/api/wishlist').set(A(t))).body.products.length).toBe(0);
    expect((await api.post(`/api/products/${prod.id}/reviews`).set(A(t)).send({ rating: 4, comment: 'Nice' })).status).toBe(201);
    expect((await api.post(`/api/products/${prod.id}/reviews`).set(A(t)).send({ rating: 5 })).status).toBe(409);
    expect((await api.get(`/api/products/${prod.id}`)).body.ratingAverage).toBe(4);
    expect((await api.post('/api/addresses').set(A(t)).send({ fullName: 'Wish List', phone: '03001234567', line1: 'Street 9, Block 4', city: 'Lahore' })).body.isDefault).toBe(true);
    expect((await api.post('/api/newsletter/subscribe').send({ email: 'n@example.com' })).status).toBe(201);
    await api.put('/api/admin/content/about').set(A(admin)).send({ title: 'Our Story' }); expect((await api.get('/api/content/about')).body.title).toBe('Our Story');
    const ps = (await api.get('/api/settings/public')).body; expect(ps.storeName).toBe('BREWORA'); expect(ps.key).toBeUndefined();
    expect((await api.get('/api/notifications').set(A(admin))).body.items.length).toBeGreaterThan(0);
    expect((await api.get('/api/docs.json')).body.paths['/api/orders']).toBeTruthy();
  });
});

describe('admin extras: contact, review moderation, image upload', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 1]);
  it('contact form: public submit, validation, admin inbox management', async () => {
    expect((await api.post('/api/contact').send({ name: 'Ali', email: 'ali@example.com', message: 'short' })).status).toBe(400);
    expect((await api.post('/api/contact').send({ name: 'Ali Khan', email: 'ali@example.com', message: 'Do you deliver to Lahore?' })).status).toBe(201);
    expect((await api.get('/api/admin/messages').set(A(cust))).status).toBe(403);
    const list = await api.get('/api/admin/messages').set(A(admin)); expect(list.body.total).toBe(1); expect(list.body.items[0].isRead).toBe(false);
    const id = list.body.items[0].id;
    expect((await api.put(`/api/admin/messages/${id}`).set(A(admin)).send({ isRead: true })).body.isRead).toBe(true);
    expect((await api.delete(`/api/admin/messages/${id}`).set(A(admin))).status).toBe(204);
  });
  it('review moderation updates the product rating', async () => {
    const list = await api.get('/api/admin/reviews').set(A(admin)); expect(list.body.total).toBeGreaterThan(0); expect(list.body.items[0].product.name).toBeTruthy();
    const r = list.body.items[0];
    expect((await api.put(`/api/admin/reviews/${r.id}/approval`).set(A(admin)).send({ isApproved: false })).body.isApproved).toBe(false);
    expect((await api.get(`/api/products/${r.productId}`)).body.ratingCount).toBe(0);
    expect((await api.put(`/api/admin/reviews/${r.id}/approval`).set(A(cust)).send({ isApproved: true })).status).toBe(403);
    expect((await api.delete(`/api/admin/reviews/${r.id}`).set(A(admin))).status).toBe(204);
  });
  it('image upload: magic-byte check, auth, size, and static serving', async () => {
    expect((await api.post('/api/admin/uploads/image').set('Content-Type', 'image/png').send(png)).status).toBe(401);
    expect((await api.post('/api/admin/uploads/image').set(A(cust)).set('Content-Type', 'image/png').send(png)).status).toBe(403);
    expect((await api.post('/api/admin/uploads/image').set(A(admin)).set('Content-Type', 'image/png').send(Buffer.from('<script>alert(1)</script>'))).status).toBe(400);
    expect((await api.post('/api/admin/uploads/image?folder=../etc').set(A(admin)).set('Content-Type', 'image/png').send(png)).status).toBe(400);
    const ok = await api.post('/api/admin/uploads/image?folder=banners').set(A(admin)).set('Content-Type', 'image/png').send(png);
    expect(ok.status).toBe(201); expect(ok.body.url).toMatch(/^\/uploads\/banners\/[0-9a-f-]+\.png$/);
    const file = await api.get(ok.body.url); expect(file.status).toBe(200); expect(file.headers['content-type']).toMatch(/image\/png/); expect(file.headers['x-content-type-options']).toBe('nosniff');
  });
});
