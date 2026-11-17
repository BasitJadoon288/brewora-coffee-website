# Collections
users, products, categories, orders (embedded items + statusHistory), payments, coupons, reviews, wishlists, carts, banners, testimonials, contents, storesettings (singleton key=main), addresses, inventorytransactions, notifications, newslettersubscribers.
Indexes: unique — user.email, product.slug/sku, category.name/slug, order.orderNumber, order.idempotencyKey (sparse), coupon.code, review(userId,productId), wishlist.userId, cart.userId, newsletter.email. Compound — product(isActive,categoryId,price), order(userId,createdAt), order(orderStatus,createdAt). Others: order.customerDetails.email, payment.transactionReference, inventory.productId.
Money is stored as PKR numbers (rounded to 2 dp); timestamps are UTC; reports group by Asia/Karachi.
