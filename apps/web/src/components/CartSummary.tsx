import { money, type Quote } from '@/lib/types';
export default function CartSummary({ q }: { q: Quote }) {
  return <dl className="space-y-2 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{money(q.subTotal)}</dd></div>
    {q.discount > 0 && <div className="flex justify-between text-green-800"><dt>Discount {q.coupon && `(${q.coupon})`}</dt><dd>−{money(q.discount)}</dd></div>}
    <div className="flex justify-between"><dt>Delivery</dt><dd>{q.deliveryCharges ? money(q.deliveryCharges) : 'Free'}</dd></div>{q.tax > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{money(q.tax)}</dd></div>}
    <div className="flex justify-between border-t border-espresso/10 pt-3 text-lg font-semibold text-espresso"><dt>Total</dt><dd>{money(q.totalAmount)}</dd></div></dl>;
}
