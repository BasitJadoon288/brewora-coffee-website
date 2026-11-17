'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { CartLine, toQuoteItems } from './cart-logic';
import type { Quote } from './types';
/** Authoritative totals from the server (prices are never trusted from the browser). */
export function useQuote(lines: CartLine[], coupon: string) {
  const items = toQuoteItems(lines);
  return useQuery({ queryKey: ['quote', JSON.stringify(items), coupon], enabled: items.length > 0, retry: false, queryFn: () => api<Quote>('/cart/quote', { method: 'POST', body: { items, couponCode: coupon || undefined } }) });
}
