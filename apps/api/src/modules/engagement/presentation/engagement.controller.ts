import { asyncHandler, pageRequest } from '../../../shared/presentation/http';
import * as UC from '../application/engagement.use-cases';
export interface EngagementUseCases {
  getWishlist: UC.GetWishlist; addToWishlist: UC.AddToWishlist; removeFromWishlist: UC.RemoveFromWishlist; moveToCart: UC.MoveWishlistToCart;
  listReviews: UC.ListReviews; addReview: UC.AddReview; deleteReview: UC.DeleteReview;
  listAddresses: UC.ListAddresses; createAddress: UC.CreateAddress; updateAddress: UC.UpdateAddress; deleteAddress: UC.DeleteAddress;
  listNotifications: UC.ListNotifications; markRead: UC.MarkNotificationRead; markAllRead: UC.MarkAllNotificationsRead; subscribe: UC.SubscribeNewsletter; listSubscribers: UC.ListSubscribers;
  contact: UC.SubmitContactMessage; listAllReviews: UC.ListAllReviews; setApproval: UC.SetReviewApproval; removeReview: UC.RemoveReview; manageMessages?: unknown;
}
export class EngagementController {
  constructor(private uc: EngagementUseCases) {}
  wishlist = asyncHandler(async (req, res) => { res.json(await this.uc.getWishlist.execute(req.user!.id)); });
  wishlistAdd = asyncHandler(async (req, res) => { res.status(201).json(await this.uc.addToWishlist.execute(req.user!.id, req.params.productId)); });
  wishlistRemove = asyncHandler(async (req, res) => { res.json(await this.uc.removeFromWishlist.execute(req.user!.id, req.params.productId)); });
  wishlistMove = asyncHandler(async (req, res) => { res.json(await this.uc.moveToCart.execute(req.user!.id, req.params.productId)); });
  reviews = asyncHandler(async (req, res) => { res.json(await this.uc.listReviews.execute(req.params.id, pageRequest(req.query, 50))); });
  addReview = asyncHandler(async (req, res) => { res.status(201).json(await this.uc.addReview.execute(req.user!, req.params.id, req.body)); });
  deleteReview = asyncHandler(async (req, res) => { await this.uc.deleteReview.execute(req.user!, req.params.id, req.params.reviewId); res.status(204).end(); });
  addresses = asyncHandler(async (req, res) => { res.json(await this.uc.listAddresses.execute(req.user!.id)); });
  createAddress = asyncHandler(async (req, res) => { res.status(201).json(await this.uc.createAddress.execute(req.user!.id, req.body)); });
  updateAddress = asyncHandler(async (req, res) => { res.json(await this.uc.updateAddress.execute(req.user!.id, req.params.id, req.body)); });
  deleteAddress = asyncHandler(async (req, res) => { await this.uc.deleteAddress.execute(req.user!.id, req.params.id); res.status(204).end(); });
  notifications = asyncHandler(async (req, res) => { res.json(await this.uc.listNotifications.execute(req.user!, pageRequest(req.query, 50))); });
  readAll = asyncHandler(async (req, res) => { res.json(await this.uc.markAllRead.execute(req.user!)); });
  readOne = asyncHandler(async (req, res) => { res.json(await this.uc.markRead.execute(req.user!, req.params.id)); });
  subscribe = asyncHandler(async (req, res) => { res.status(201).json(await this.uc.subscribe.execute(req.body.email)); });
  contact = asyncHandler(async (req, res) => { res.status(201).json(await this.uc.contact.execute(req.body)); });
  adminReviews = asyncHandler(async (req, res) => { const a = req.query.approved; res.json(await this.uc.listAllReviews.execute(pageRequest(req.query), a === 'true' ? true : a === 'false' ? false : undefined)); });
  approve = asyncHandler(async (req, res) => { res.json(await this.uc.setApproval.execute(req.params.id, req.body.isApproved)); });
  adminRemoveReview = asyncHandler(async (req, res) => { await this.uc.removeReview.execute(req.params.id); res.status(204).end(); });
  subscribers = asyncHandler(async (req, res) => { res.json(await this.uc.listSubscribers.execute(pageRequest(req.query))); });
}
