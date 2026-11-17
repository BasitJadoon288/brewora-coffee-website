import { BadRequestError, ConflictError, NotFoundError } from '../../../shared/domain/errors';
import { round2 } from '../../../shared/domain/text';
import { ProductRepository } from '../../catalog/domain/product';
import { unitPrice } from '../../pricing/domain/pricing';
import { Cart, CartRepository, emptyCart, findLine } from '../domain/cart';
import { CartItemInput } from './cart.dto';

export class CartViewBuilder {
  constructor(private carts: CartRepository, private products: ProductRepository) {}
  async build(userId: string) {
    const cart = (await this.carts.findByUser(userId)) ?? emptyCart(userId);
    const by = new Map((await this.products.findByIds(cart.items.map(i => i.productId), false)).map(p => [p.id, p]));
    const items = cart.items.map(i => {
      const p = by.get(i.productId); const v = p?.variants.find(x => x.name === i.variant); const up = p ? unitPrice(p, v?.priceDelta ?? 0) : 0;
      return { id: i.id, productId: i.productId, variant: i.variant, quantity: i.quantity, name: p?.name, slug: p?.slug, image: p?.images?.[0]?.url, unitPrice: up, lineTotal: round2(up * i.quantity), available: !!p && p.isActive && p.stockQuantity >= i.quantity, stockQuantity: p?.stockQuantity ?? 0 };
    });
    return { items, subTotal: round2(items.reduce((s, l) => s + l.lineTotal, 0)) };
  }
}
export class GetCart { constructor(private view: CartViewBuilder) {} execute(userId: string) { return this.view.build(userId); } }
export class AddCartItem {
  constructor(private carts: CartRepository, private products: ProductRepository, private view: CartViewBuilder) {}
  async execute(userId: string, i: CartItemInput) {
    const cart = (await this.carts.findByUser(userId)) ?? emptyCart(userId);
    const ex = findLine(cart, i.productId, i.variant); const qty = (ex?.quantity ?? 0) + i.quantity;
    await this.assertBuyable(i.productId, i.variant, qty);
    if (ex) ex.quantity = qty; else cart.items.push({ productId: i.productId, variant: i.variant, quantity: i.quantity });
    await this.carts.save(cart); return this.view.build(userId);
  }
  async assertBuyable(productId: string, variant: string | undefined, qty: number) {
    const p = await this.products.findById(productId, true); if (!p) throw new NotFoundError('Product not found');
    if (variant && !p.variants.some(v => v.name === variant)) throw new BadRequestError('Invalid variant');
    if (qty > p.stockQuantity) throw new ConflictError(`Only ${p.stockQuantity} in stock`);
  }
}
const need = async (carts: CartRepository, userId: string, itemId: string): Promise<[Cart, Cart['items'][number]]> => {
  const c = await carts.findByUser(userId); const it = c?.items.find(i => i.id === itemId);
  if (!c || !it) throw new NotFoundError('Cart item not found'); return [c, it];
};
export class UpdateCartItem {
  constructor(private carts: CartRepository, private add: AddCartItem, private view: CartViewBuilder) {}
  async execute(userId: string, itemId: string, quantity: number) {
    const [cart, it] = await need(this.carts, userId, itemId);
    await this.add.assertBuyable(it.productId, it.variant, quantity); it.quantity = quantity; await this.carts.save(cart); return this.view.build(userId);
  }
}
export class RemoveCartItem {
  constructor(private carts: CartRepository, private view: CartViewBuilder) {}
  async execute(userId: string, itemId: string) { const [cart] = await need(this.carts, userId, itemId); cart.items = cart.items.filter(i => i.id !== itemId); await this.carts.save(cart); return this.view.build(userId); }
}
/** Merges a guest (localStorage) cart after login; quantities are clamped to stock, unbuyable items are reported. */
export class MergeGuestCart {
  constructor(private carts: CartRepository, private products: ProductRepository, private add: AddCartItem, private view: CartViewBuilder) {}
  async execute(userId: string, guest: CartItemInput[]) {
    const skipped: string[] = [];
    for (const g of guest) {
      try { await this.add.execute(userId, g); } catch (e) {
        if (e instanceof ConflictError) {
          const p = await this.products.findById(g.productId, true); const have = findLine((await this.carts.findByUser(userId)) ?? emptyCart(userId), g.productId, g.variant)?.quantity ?? 0;
          if (p && p.stockQuantity > have) { try { await this.add.execute(userId, { ...g, quantity: p.stockQuantity - have }); continue; } catch { /* fall through */ } }
        }
        skipped.push(g.productId);
      }
    }
    return { ...(await this.view.build(userId)), skipped };
  }
}
