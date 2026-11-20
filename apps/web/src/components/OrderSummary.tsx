'use client';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { openPdf } from '@/lib/api';
import { fmtDate, money, type Order } from '@/lib/types';
import { useToast } from './toast';
import { Badge } from './ui';
export default function OrderSummary({ o }: { o: Order }) {
  const toast = useToast(); const [busy, setBusy] = useState(false);
  const delivered = o.orderStatus === 'Delivered'; const cancelled = o.orderStatus === 'Cancelled';
  async function receipt() {
    setBusy(true);
    try { await openPdf(`/orders/track/${encodeURIComponent(o.orderNumber)}/receipt?email=${encodeURIComponent(o.customerDetails.email)}`); }
    catch { toast('Could not open the receipt. Please try again.', 'err'); } finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-3"><Badge value={o.orderStatus} /><span className="text-sm text-charcoal/60">Payment: {o.paymentMethod} · </span><Badge value={o.paymentStatus} /><span className="text-sm text-charcoal/60">Placed {fmtDate(o.createdAt)}</span>
      {!cancelled && <button onClick={receipt} disabled={busy} className="ml-auto inline-flex items-center gap-2 rounded-full bg-espresso px-4 py-2 text-sm font-medium text-cream shadow-soft transition hover:bg-espresso/90 active:scale-95 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden />{busy ? 'Opening…' : delivered ? 'Delivery receipt (PDF)' : 'Download receipt (PDF)'}</button>}</div>
    <div className="overflow-x-auto rounded-2xl bg-white shadow-soft"><table className="w-full text-left text-sm"><thead className="border-b border-espresso/10 text-charcoal/60"><tr><th className="p-3">Item</th><th>Qty</th><th>Price</th><th className="pr-3 text-right">Total</th></tr></thead><tbody>
      {o.items.map((i, k) => <tr key={k} className="border-b border-espresso/5"><td className="p-3">{i.name}{i.variant && <span className="text-charcoal/50"> ({i.variant})</span>}</td><td>{i.quantity}</td><td>{money(i.unitPrice)}</td><td className="pr-3 text-right">{money(i.lineTotal)}</td></tr>)}</tbody></table>
      <dl className="space-y-1 p-4 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{money(o.subTotal)}</dd></div>{o.discount > 0 && <div className="flex justify-between text-green-800"><dt>Discount {o.couponCode && `(${o.couponCode})`}</dt><dd>−{money(o.discount)}</dd></div>}
        <div className="flex justify-between"><dt>Delivery</dt><dd>{o.deliveryCharges ? money(o.deliveryCharges) : 'Free'}</dd></div>{o.tax > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{money(o.tax)}</dd></div>}
        <div className="flex justify-between border-t border-espresso/10 pt-2 text-base font-semibold text-espresso"><dt>Total</dt><dd>{money(o.totalAmount)}</dd></div></dl></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-white p-5 text-sm shadow-soft"><p className="font-semibold">Customer</p><p className="mt-1 text-charcoal/70">{o.customerDetails.fullName}<br />{o.customerDetails.email}<br />{o.customerDetails.phone}</p></div>
      <div className="rounded-2xl bg-white p-5 text-sm shadow-soft"><p className="font-semibold">Delivery address</p><p className="mt-1 text-charcoal/70">{o.shippingAddress.line1}<br />{o.shippingAddress.area && <>{o.shippingAddress.area}, </>}{o.shippingAddress.city} {o.shippingAddress.postalCode}</p></div></div>
  </div>;
}
