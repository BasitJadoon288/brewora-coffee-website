/**
 * Composition root: the ONLY place where concrete infrastructure is wired to use cases.
 * Everything else depends on interfaces (ports) declared in the domain/application layers.
 */
import { CookieOptions } from 'express';
import { AppConfig } from './shared/application/ports';
import { ManageResource } from './shared/application/crud.use-cases';
import { BcryptHasher } from './shared/infrastructure/bcrypt.hasher';
import { Env } from './shared/infrastructure/env';
import { JwtTokenService } from './shared/infrastructure/jwt.token-service';
import { NodemailerMailer } from './shared/infrastructure/nodemailer.mailer';
import { createAuthGuards } from './shared/presentation/http';

import * as Auth from './modules/identity/application/auth.use-cases';
import { MongoUserRepository } from './modules/identity/infrastructure/mongo-user.repository';
import { AuthController } from './modules/identity/presentation/auth.controller';

import * as Cat from './modules/catalog/application/catalog.use-cases';
import { MongoCategoryRepository } from './modules/catalog/infrastructure/mongo-category.repository';
import { MongoInventoryLedger } from './modules/catalog/infrastructure/mongo-inventory.ledger';
import { MongoProductRepository } from './modules/catalog/infrastructure/mongo-product.repository';
import { CatalogController } from './modules/catalog/presentation/catalog.controller';

import { GetPublicSettings, GetSettings, UpdateSettings } from './modules/settings/application/settings.use-cases';
import { MongoSettingsRepository } from './modules/settings/infrastructure/mongo-settings.repository';
import { SettingsController } from './modules/settings/presentation/settings.controller';

import { ListActiveDeliveryAreas } from './modules/delivery/application/delivery.use-cases';
import { MongoDeliveryAreaRepository } from './modules/delivery/infrastructure/mongo-delivery-area.repository';
import { ManageCoupons, ValidateCoupon } from './modules/promotions/application/coupon.use-cases';
import { MongoCouponRepository } from './modules/promotions/infrastructure/mongo-coupon.repository';

import { QuoteService } from './modules/pricing/application/quote.service';

import * as CartUC from './modules/cart/application/cart.use-cases';
import { MongoCartRepository } from './modules/cart/infrastructure/mongo-cart.repository';
import { CartController } from './modules/cart/presentation/cart.controller';

import { PlaceOrder } from './modules/orders/application/place-order';
import * as OrderUC from './modules/orders/application/order.use-cases';
import { MongoOrderRepository, SequentialOrderNumberGenerator } from './modules/orders/infrastructure/mongo-order.repository';
import { MongoPaymentRepository } from './modules/orders/infrastructure/mongo-payment.repository';
import { OrderController } from './modules/orders/presentation/order.controller';

import { HandleGatewayCallback, InitiatePayment, SubmitBankReference } from './modules/payments/application/payment.use-cases';
import { EasyPaisaGateway, JazzCashGateway } from './modules/payments/infrastructure/gateways';
import { PaymentController } from './modules/payments/presentation/payment.controller';

import * as Eng from './modules/engagement/application/engagement.use-cases';
import { RepositoryNotifier } from './modules/engagement/infrastructure/repository-notifier';
import { MongoContactRepository, MongoAddressRepository, MongoNewsletterRepository, MongoNotificationRepository, MongoReviewRepository, MongoWishlistRepository } from './modules/engagement/infrastructure/mongo-engagement.repositories';
import { EngagementController } from './modules/engagement/presentation/engagement.controller';

import { GetPageContent, ListActiveBanners, ListActiveTestimonials, UpdatePageContent } from './modules/content/application/content.use-cases';
import { MongoBannerRepository, MongoPageContentRepository, MongoTestimonialRepository } from './modules/content/infrastructure/mongo-content.repositories';

import * as Rep from './modules/reporting/application/reporting.use-cases';
import { MongoReportingRepository } from './modules/reporting/infrastructure/mongo-reporting.repository';
import { AdminController } from './modules/reporting/presentation/admin.controller';

import path from 'path';
import { GetStoredImage, SignUpload, UploadImage } from './modules/uploads/application/upload';
import { MongoImageStorage } from './modules/uploads/infrastructure/mongo-image.storage';
import { CloudinarySigner } from './modules/uploads/infrastructure/cloudinary.signer';

export function buildContainer(env: Env) {
  const config: AppConfig = { customerUrl: env.CUSTOMER_URL, apiUrl: env.API_URL };

  // ---- infrastructure services
  const mailer = new NodemailerMailer({ host: env.SMTP_HOST, port: env.SMTP_PORT, user: env.SMTP_USER, pass: env.SMTP_PASS, from: env.MAIL_FROM });
  const hasher = new BcryptHasher(env.NODE_ENV === 'test' ? 4 : 12);
  const tokens = new JwtTokenService(env.JWT_ACCESS_SECRET, env.JWT_REFRESH_SECRET);
  const gateways = {
    JazzCash: new JazzCashGateway({ merchantId: env.JAZZCASH_MERCHANT_ID, password: env.JAZZCASH_PASSWORD, salt: env.JAZZCASH_INTEGRITY_SALT, baseUrl: env.JAZZCASH_BASE_URL }),
    EasyPaisa: new EasyPaisaGateway({ storeId: env.EASYPAISA_STORE_ID, hashKey: env.EASYPAISA_HASH_KEY, baseUrl: env.EASYPAISA_BASE_URL }),
  };
  const signer = new CloudinarySigner({ cloudName: env.CLOUDINARY_CLOUD_NAME, apiKey: env.CLOUDINARY_API_KEY, apiSecret: env.CLOUDINARY_API_SECRET });

  // ---- repositories (adapters)
  const repos = {
    users: new MongoUserRepository(), categories: new MongoCategoryRepository(), products: new MongoProductRepository(), ledger: new MongoInventoryLedger(),
    settings: new MongoSettingsRepository(), coupons: new MongoCouponRepository(), carts: new MongoCartRepository(), orders: new MongoOrderRepository(), payments: new MongoPaymentRepository(),
    reviews: new MongoReviewRepository(), wishlist: new MongoWishlistRepository(), addresses: new MongoAddressRepository(), notifications: new MongoNotificationRepository(),
    newsletter: new MongoNewsletterRepository(), banners: new MongoBannerRepository(), testimonials: new MongoTestimonialRepository(), pageContent: new MongoPageContentRepository(),
    reporting: new MongoReportingRepository(), contact: new MongoContactRepository(), areas: new MongoDeliveryAreaRepository(),
  };
  const uploadDir = path.resolve(env.UPLOAD_DIR ?? 'uploads');
  const numbers = new SequentialOrderNumberGenerator();
  const notifier = new RepositoryNotifier(repos.notifications);
  const quote = new QuoteService(repos.products, repos.coupons, repos.settings, repos.areas);

  // ---- identity
  const sessions = new Auth.SessionIssuer(repos.users, tokens);
  const otps = new Auth.OtpService(repos.users, tokens);
  const verification = new Auth.EmailVerificationSender(repos.users, tokens, mailer, config, otps);
  const auth: Auth.AuthUseCases = {
    register: new Auth.RegisterUser(repos.users, hasher, sessions, verification), login: new Auth.LoginUser(repos.users, hasher, sessions), refresh: new Auth.RefreshSession(repos.users, tokens, sessions),
    logout: new Auth.LogoutUser(repos.users), forgotPassword: new Auth.RequestPasswordReset(repos.users, tokens, mailer, config, otps), resetPassword: new Auth.ResetPassword(repos.users, tokens, hasher, otps),
    verifyEmail: new Auth.VerifyEmail(repos.users, tokens, otps), resendVerification: new Auth.ResendVerification(repos.users, verification, otps), changePassword: new Auth.ChangePassword(repos.users, hasher),
    getProfile: new Auth.GetProfile(repos.users), updateProfile: new Auth.UpdateProfile(repos.users),
  };
  const cookie: CookieOptions = { httpOnly: true, sameSite: 'strict', secure: env.NODE_ENV === 'production', path: '/api/auth', maxAge: 7 * 86400e3 };

  // ---- catalog
  const catalog = {
    listProducts: new Cat.ListProducts(repos.products, repos.categories), getBySlug: new Cat.GetProductBySlug(repos.products), getProduct: new Cat.GetProduct(repos.products),
    createProduct: new Cat.CreateProduct(repos.products, repos.ledger), updateProduct: new Cat.UpdateProduct(repos.products, repos.ledger), deleteProduct: new Cat.DeleteProduct(repos.products),
    listCategories: new Cat.ListCategories(repos.categories), createCategory: new Cat.CreateCategory(repos.categories), updateCategory: new Cat.UpdateCategory(repos.categories),
    deleteCategory: new Cat.DeleteCategory(repos.categories, repos.products), adjustStock: new Cat.AdjustStock(repos.products, repos.ledger),
    listInventory: new Cat.ListInventory(repos.products, repos.settings), inventoryHistory: new Cat.GetInventoryHistory(repos.ledger),
  };

  // ---- cart
  const cartView = new CartUC.CartViewBuilder(repos.carts, repos.products);
  const addCartItem = new CartUC.AddCartItem(repos.carts, repos.products, cartView);
  const cart = { quote, get: new CartUC.GetCart(cartView), add: addCartItem, update: new CartUC.UpdateCartItem(repos.carts, addCartItem, cartView), remove: new CartUC.RemoveCartItem(repos.carts, cartView), merge: new CartUC.MergeGuestCart(repos.carts, repos.products, addCartItem, cartView) };

  // ---- orders & payments
  const lifecycle = { orders: repos.orders, payments: repos.payments, products: repos.products, coupons: repos.coupons, ledger: repos.ledger, notifier, mailer, settings: repos.settings };
  const updateStatus = new OrderUC.UpdateOrderStatus(lifecycle);
  const placeOrder = new PlaceOrder({ quote, products: repos.products, coupons: repos.coupons, orders: repos.orders, payments: repos.payments, ledger: repos.ledger, carts: repos.carts, settings: repos.settings, numbers, notifier, mailer });
  const orders = {
    place: placeOrder, mine: new OrderUC.ListMyOrders(repos.orders), get: new OrderUC.GetOrder(repos.orders, repos.payments), track: new OrderUC.TrackOrder(repos.orders),
    cancel: new OrderUC.CancelOwnOrder(repos.orders, updateStatus), updateStatus, markPayment: new OrderUC.MarkPaymentStatus(repos.orders, repos.payments),
    refund: new OrderUC.RefundOrder(repos.orders, repos.payments), receipt: new OrderUC.GenerateReceipt(repos.orders, repos.settings), detailForAdmin: new OrderUC.GetOrderDetailForAdmin(repos.orders, repos.payments, repos.users),
  };
  const payments = { initiate: new InitiatePayment(repos.orders, repos.payments, repos.settings, gateways, config), bank: new SubmitBankReference(repos.orders, repos.payments), callback: new HandleGatewayCallback(repos.orders, repos.payments, gateways) };

  // ---- engagement
  const getWishlist = new Eng.GetWishlist(repos.wishlist, repos.products); const rating = new Eng.RatingUpdater(repos.reviews, repos.products);
  const engagement = {
    getWishlist, addToWishlist: new Eng.AddToWishlist(repos.wishlist, repos.products, getWishlist), removeFromWishlist: new Eng.RemoveFromWishlist(repos.wishlist, getWishlist), moveToCart: new Eng.MoveWishlistToCart(repos.wishlist, addCartItem),
    listReviews: new Eng.ListReviews(repos.reviews), addReview: new Eng.AddReview(repos.reviews, repos.products, repos.users, repos.orders, rating), deleteReview: new Eng.DeleteReview(repos.reviews, rating),
    listAddresses: new Eng.ListAddresses(repos.addresses), createAddress: new Eng.CreateAddress(repos.addresses), updateAddress: new Eng.UpdateAddress(repos.addresses), deleteAddress: new Eng.DeleteAddress(repos.addresses),
    listNotifications: new Eng.ListNotifications(repos.notifications), markRead: new Eng.MarkNotificationRead(repos.notifications), markAllRead: new Eng.MarkAllNotificationsRead(repos.notifications),
    subscribe: new Eng.SubscribeNewsletter(repos.newsletter), listSubscribers: new Eng.ListSubscribers(repos.newsletter),
    contact: new Eng.SubmitContactMessage(repos.contact), listAllReviews: new Eng.ListAllReviews(repos.reviews), setApproval: new Eng.SetReviewApproval(repos.reviews, rating), removeReview: new Eng.RemoveReview(repos.reviews, rating),
    manageMessages: new ManageResource(repos.contact, 'Message'),
  };

  // ---- content, settings, promotions, uploads
  const content = { banners: new ListActiveBanners(repos.banners), testimonials: new ListActiveTestimonials(repos.testimonials), page: new GetPageContent(repos.pageContent), updatePage: new UpdatePageContent(repos.pageContent),
    manageBanners: new ManageResource(repos.banners, 'Banner'), manageTestimonials: new ManageResource(repos.testimonials, 'Testimonial') };
  const settings = { public: new GetPublicSettings(repos.settings), get: new GetSettings(repos.settings), update: new UpdateSettings(repos.settings) };
  const promotions = { manage: new ManageCoupons(repos.coupons), validate: new ValidateCoupon(repos.coupons) };
  const delivery = { list: new ListActiveDeliveryAreas(repos.areas), manage: new ManageResource(repos.areas, 'Delivery area') };
  const imageStore = new MongoImageStorage();
  const uploads = { sign: new SignUpload(signer), image: new UploadImage(imageStore), serve: new GetStoredImage(imageStore) };

  // ---- reporting
  const reporting = {
    dashboard: new Rep.GetDashboard(repos.reporting, repos.products, repos.settings, repos.notifications), searchOrders: new Rep.SearchOrders(repos.reporting), orderDetail: orders.detailForAdmin,
    updateStatus, markPayment: orders.markPayment, refund: orders.refund, customers: new Rep.ListCustomers(repos.reporting), customer: new Rep.GetCustomerProfile(repos.users, repos.reporting),
    setActive: new Rep.SetCustomerActive(repos.users), report: new Rep.GetReport(repos.reporting), analytics: new Rep.GetAnalytics(repos.reporting), subscribers: engagement.listSubscribers, settings: settings.get, receipt: orders.receipt,
  };

  const useCases = { auth, catalog, cart, orders, payments, engagement, content, settings, promotions, delivery, uploads, reporting };
  const controllers = {
    auth: new AuthController(auth, cookie), catalog: new CatalogController(catalog), cart: new CartController(cart),
    orders: new OrderController({ place: orders.place, mine: orders.mine, get: orders.get, track: orders.track, cancel: orders.cancel, receipt: orders.receipt }),
    payments: new PaymentController(payments, env.CUSTOMER_URL), engagement: new EngagementController(engagement), settings: new SettingsController(settings.public, settings.get, settings.update), admin: new AdminController(reporting),
  };
  return { config, uploadDir, guards: createAuthGuards(tokens), services: { hasher, tokens, mailer }, repos, useCases, controllers };
}
export type Container = ReturnType<typeof buildContainer>;
