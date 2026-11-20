import mongoose from 'mongoose';
import { createApplication } from '../bootstrap';
import { slugify } from '../shared/domain/text';
import { connectDatabase } from '../shared/infrastructure/mongo';
import { loadEnv } from '../shared/infrastructure/env';
import crypto from 'crypto';
import { DEFAULT_CONTENT } from './default-content';

const reset = process.argv.includes('--reset');
const CATS: [string, string][] = [['Espresso', 'Bold, concentrated shots'], ['Cappuccino', 'Velvety foam, balanced richness'], ['Latte', 'Smooth espresso with steamed milk'], ['Mocha', 'Espresso meets premium chocolate'],
  ['Americano', 'Clean, long black coffee'], ['Iced Coffee', 'Chilled and refreshing'], ['Cold Brew', 'Slow-steeped for 18 hours'], ['Coffee Beans', 'Freshly roasted whole beans']];
const drink = [{ name: 'Small', size: '250ml', priceDelta: 0 }, { name: 'Regular', size: '350ml', priceDelta: 100 }, { name: 'Large', size: '450ml', priceDelta: 200 }];
const beans = [{ name: '250g', size: '250g', priceDelta: 0 }, { name: '500g', size: '500g', priceDelta: 1000 }, { name: '1kg', size: '1kg', priceDelta: 2200 }];
// name, price, discount, category, short, bestSeller, featured, stock, isBeans
const P: [string, number, number | null, string, string, boolean, boolean, number, boolean][] = [
  ['Premium Espresso', 450, null, 'Espresso', 'Double shot of our signature roast.', true, true, 120, false],
  ['Classic Cappuccino', 550, null, 'Cappuccino', 'Equal parts espresso, milk and foam.', true, true, 100, false],
  ['Vanilla Latte', 650, 590, 'Latte', 'Silky latte with Madagascar vanilla.', true, false, 90, false],
  ['Caramel Macchiato', 750, null, 'Latte', 'Vanilla milk, espresso and caramel drizzle.', true, true, 80, false],
  ['Iced Americano', 500, null, 'Iced Coffee', 'Espresso over ice and cold water.', false, true, 110, false],
  ['Mocha Delight', 700, 650, 'Mocha', 'Dark chocolate, espresso and steamed milk.', true, false, 85, false],
  ['Cold Brew', 600, null, 'Cold Brew', 'Smooth, low-acid, steeped 18 hours.', false, true, 70, false],
  ['Premium Coffee Beans', 1200, null, 'Coffee Beans', 'Single-origin Arabica, medium roast.', true, true, 60, true],
  ['Spanish Latte', 750, null, 'Latte', 'Sweetened condensed milk and espresso.', true, false, 75, false],
  ['Hazelnut Latte', 700, null, 'Latte', 'Toasted hazelnut with creamy milk.', false, false, 65, false],
  ['Flat White', 600, null, 'Latte', 'Ristretto with micro-foam milk.', false, false, 60, false],
  ['Signature Brewora Blend', 1400, 1250, 'Coffee Beans', 'Our house blend, notes of caramel and cocoa.', true, true, 50, true],
  ['Classic Americano', 480, null, 'Americano', 'Espresso lengthened with hot water.', false, false, 100, false],
];

async function main() {
  const env = loadEnv();
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 10) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 10 chars) in .env before seeding');
  await connectDatabase(env.MONGODB_URI);
  if (reset) { for (const m of Object.values(mongoose.models)) await m.deleteMany({}); console.log('Database cleared'); }
  const { container: c } = createApplication(env); const { repos: r, services, useCases: u } = c;

  let admin = (await r.users.getCredentialsByEmail(env.ADMIN_EMAIL.toLowerCase()))?.user;
  if (!admin) admin = await r.users.create({ fullName: env.ADMIN_NAME ?? 'BREWORA Admin', email: env.ADMIN_EMAIL.toLowerCase(), passwordHash: await services.hasher.hash(env.ADMIN_PASSWORD), role: 'Admin', isEmailVerified: true });
  console.log(`Admin: ${admin.email}`);

  const catIds: Record<string, string> = {};
  for (const [name, description] of CATS) { const slug = slugify(name); catIds[name] = ((await r.categories.findBySlug(slug)) ?? (await r.categories.create({ name, slug, description, image: `/assets/categories/${slug}.jpg`, isActive: true }))).id; }
  for (const [name, price, discountPrice, cat, shortDescription, isBestSeller, isFeatured, stockQuantity, isBeans] of P) {
    const slug = slugify(name); if (await r.products.findBySlug(slug)) continue;
    const p = await r.products.create({ name, slug, price, discountPrice: discountPrice ?? undefined, categoryId: catIds[cat], shortDescription, description: `${shortDescription} Crafted by BREWORA from ethically sourced beans and prepared for a premium cup, every time.`,
      images: [{ url: `/assets/products/${slug}.jpg`, alt: name }, { url: `/assets/products/${slug}-2.jpg`, alt: `${name} serving` }], variants: isBeans ? beans : drink, sku: `BRW-${slug.toUpperCase().slice(0, 12)}`, stockQuantity, isBestSeller, isFeatured, isActive: true,
      specifications: isBeans ? { Origin: 'Pakistan/Colombia blend', Roast: 'Medium', Process: 'Washed' } : { Serving: 'Hot/Iced', Milk: 'Fresh dairy', Caffeine: 'Medium' } });
    await r.ledger.record({ productId: p.id, type: 'Initial', change: stockQuantity, balanceAfter: stockQuantity, reason: 'Seed data' });
  }
  await r.settings.update({ storeName: 'BREWORA', contactEmail: 'hello@brewora.pk', phone: '+92 300 0000000', whatsapp: '+92 300 0000000', address: 'Karachi, Pakistan',
    paymentMethods: { COD: true, BankTransfer: true, JazzCash: !!(env.JAZZCASH_MERCHANT_ID && env.JAZZCASH_INTEGRITY_SALT), EasyPaisa: !!(env.EASYPAISA_STORE_ID && env.EASYPAISA_HASH_KEY) },
    bank: { bankName: 'Replace in Admin > Settings', accountTitle: 'BREWORA', accountNumber: '0000000000', instructions: 'Use your order number as the transfer reference.' } });
  for (const cp of [{ code: 'WELCOME10', description: '10% off your first order', discountType: 'Percentage' as const, discountValue: 10, maxDiscount: 500, minimumOrderAmount: 1000, isActive: true },
    { code: 'FLAT200', description: 'Rs. 200 off orders above Rs. 2,000', discountType: 'Fixed' as const, discountValue: 200, minimumOrderAmount: 2000, isActive: true },
    { code: 'EXPIRED5', description: 'Expired sample', discountType: 'Percentage' as const, discountValue: 5, minimumOrderAmount: 0, expiryDate: new Date('2020-01-01'), isActive: true }])
    if (!(await r.coupons.findByCode(cp.code))) await u.promotions.manage.create(cp);
  if ((await r.areas.list(undefined, { page: 1, limit: 1 })).total === 0) {
    const areas: [string, number][] = [['Clifton', 150], ['DHA', 150], ['Gulshan-e-Iqbal', 200], ['Gulistan-e-Johar', 200], ['North Nazimabad', 220], ['PECHS', 180], ['Saddar', 180], ['Nazimabad', 220], ['Korangi', 250], ['Malir', 280], ['Bahadurabad', 180], ['FB Area', 220]];
    for (const [i, [name, charge]] of areas.entries()) await r.areas.create({ name, city: 'Karachi', charge, freeDeliveryThreshold: null, isActive: true, sortOrder: i });
  }
  const one = { page: 1, limit: 1 };
  if ((await r.banners.list(undefined, one)).total === 0) {
    await r.banners.create({ title: 'Discover the Perfect Cup', subtitle: 'Rich Flavor. Premium Quality. Delivered to Your Doorstep.', image: '/assets/banners/hero.jpg', linkUrl: '/shop', buttonText: 'Shop Now', placement: 'hero', sortOrder: 0, isActive: true });
    await r.banners.create({ title: 'Free delivery over Rs. 3,000', subtitle: 'Sip • Relax • Enjoy', image: '/assets/banners/promo.jpg', linkUrl: '/shop', buttonText: 'Explore Collection', placement: 'promo', sortOrder: 1, isActive: true });
  }
  if ((await r.testimonials.list(undefined, one)).total === 0) for (const t of [['Ayesha K.', 'The Spanish Latte is the best I have had in Karachi, delivered fresh.', 5], ['Hamza R.', 'Signature Blend beans make my mornings. Great packaging too.', 5], ['Sana M.', 'Fast delivery and the cold brew was perfectly smooth.', 4]] as const)
    await r.testimonials.create({ name: t[0], text: t[1], rating: t[2], isActive: true });
  for (const [key, data] of Object.entries(DEFAULT_CONTENT)) if (!Object.keys(await r.pageContent.get(key)).length) await r.pageContent.put(key, data);

  if ((await r.reporting.countOrders()) === 0) {
    const pw = env.SEED_DEMO_PASSWORD ?? crypto.randomBytes(9).toString('base64url') + 'A1';
    const people = [['Ayesha Khan', 'ayesha@example.com', '03001234567'], ['Hamza Raza', 'hamza@example.com', '03211234567'], ['Sana Malik', 'sana@example.com', '03331234567']];
    const prods = (await r.products.search({ activeOnly: true }, 'newest', { page: 1, limit: 6 })).items; let n = 0;
    const addr = { line1: 'House 12, Street 5, Clifton', city: 'Karachi', postalCode: '75600' };
    for (const [fullName, email, phone] of people) {
      const user = (await r.users.getCredentialsByEmail(email))?.user ?? (await r.users.create({ fullName, email, phoneNumber: phone, passwordHash: await services.hasher.hash(pw), role: 'Customer', isEmailVerified: true }));
      await r.addresses.create(user.id, { label: 'Home', fullName, phone, ...addr, isDefault: true });
      for (let k = 0; k < 2; k++) {
        const items = [{ productId: prods[(n + k) % 6].id, quantity: 1 + k, variant: 'Regular' }, { productId: prods[(n + k + 2) % 6].id, quantity: 2, variant: 'Small' }];
        const { order } = await u.orders.place.execute(user.id, { items, paymentMethod: 'COD', couponCode: k === 0 ? 'WELCOME10' : undefined, customer: { fullName, email, phone }, shippingAddress: addr });
        const flow = n % 3 === 0 ? ['Confirmed', 'Processing', 'Shipped', 'Delivered'] : n % 3 === 1 ? ['Confirmed'] : [];
        for (const s of flow) await u.orders.updateStatus.execute(order.id, s as any, admin.id, 'Seed');
        if (flow.length === 4) await u.engagement.addReview.execute({ id: user.id, role: 'Customer' }, items[0].productId, { rating: 5 - (n % 2), comment: 'Excellent quality and fresh taste.' }).catch(() => undefined);
        n++;
      }
    }
    console.log(`Demo customers password: ${pw}`);
  }
  await new Promise(r => setTimeout(r, 500)); // let fire-and-forget notifications finish before disconnecting
  console.log('Seed complete'); await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
