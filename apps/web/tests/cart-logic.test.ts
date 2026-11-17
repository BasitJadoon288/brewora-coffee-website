import { describe, expect, it } from 'vitest';
import { addLine, countOf, lineKey, parseStored, removeLine, setQuantity, subTotalOf, toQuoteItems } from '../src/lib/cart-logic';
const id1 = 'a'.repeat(24), id2 = 'b'.repeat(24);
const item = (o: object = {}) => ({ productId: id1, name: 'Latte', slug: 'latte', unitPrice: 650, quantity: 1, ...o });
describe('guest cart logic', () => {
  it('adds a new line and merges the same product+variant', () => {
    let l = addLine([], item({ variant: 'Large' })); l = addLine(l, item({ variant: 'Large', quantity: 2 })); l = addLine(l, item({ variant: 'Small' }));
    expect(l).toHaveLength(2); expect(l.find(x => x.variant === 'Large')!.quantity).toBe(3);
  });
  it('caps quantity and never goes below 1', () => {
    expect(addLine([], item({ quantity: 500 }))[0].quantity).toBe(50);
    const l = addLine([], item()); expect(setQuantity(l, l[0].key, 0)[0].quantity).toBe(1); expect(setQuantity(l, l[0].key, 7)[0].quantity).toBe(7);
  });
  it('removes lines and computes count / subtotal / quote items', () => {
    let l = addLine([], item({ quantity: 2 })); l = addLine(l, item({ productId: id2, unitPrice: 450, quantity: 1 }));
    expect(countOf(l)).toBe(3); expect(subTotalOf(l)).toBe(1750); expect(toQuoteItems(l)[0]).toEqual({ productId: id1, variant: undefined, quantity: 2 });
    expect(removeLine(l, lineKey(id1))).toHaveLength(1);
  });
  it('parseStored drops malformed or tampered entries', () => {
    expect(parseStored('not json')).toEqual([]); expect(parseStored('{"a":1}')).toEqual([]);
    const ok = parseStored(JSON.stringify([item({ quantity: 2 }), item({ productId: '../../x' }), item({ quantity: -3 }), { nope: true }, item({ name: 5 })]));
    expect(ok).toHaveLength(1); expect(ok[0].quantity).toBe(2);
  });
});
