export interface CartItem { id?: string; productId: string; variant?: string; quantity: number }
export interface Cart { userId: string; items: CartItem[] }
export const emptyCart = (userId: string): Cart => ({ userId, items: [] });
export const findLine = (c: Cart, productId: string, variant?: string) => c.items.find(i => i.productId === productId && (i.variant ?? '') === (variant ?? ''));
export interface CartRepository { findByUser(userId: string): Promise<Cart | null>; save(cart: Cart): Promise<Cart>; delete(userId: string): Promise<void> }
