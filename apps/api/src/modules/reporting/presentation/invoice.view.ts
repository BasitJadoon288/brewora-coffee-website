import { escapeHtml as e } from '../../../shared/domain/text';
import { Order } from '../../orders/domain/order';
import { StoreSettings } from '../../settings/domain/settings';
export function renderInvoice(o: Order, s: StoreSettings) {
  const rows = o.items.map(i => `<tr><td>${e(i.name)}${i.variant ? ` (${e(i.variant)})` : ''}</td><td>${i.quantity}</td><td>Rs. ${i.unitPrice}</td><td>Rs. ${i.lineTotal}</td></tr>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>Invoice ${e(o.orderNumber)}</title><style>body{font-family:Arial;max-width:760px;margin:30px auto;color:#25201D}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}h1{color:#3B2418}@media print{button{display:none}}</style>
<button onclick="print()">Print</button><h1>${e(s.storeName)}</h1><p>${e(s.address)}<br>${e(s.contactEmail)} ${e(s.phone)}</p><h2>Invoice ${e(o.orderNumber)}</h2><p>Date: ${new Date(o.createdAt).toISOString().slice(0, 10)}<br>Customer: ${e(o.customerDetails.fullName)} (${e(o.customerDetails.email)}, ${e(o.customerDetails.phone)})<br>Ship to: ${e(o.shippingAddress.line1)}, ${e(o.shippingAddress.city)} ${e(o.shippingAddress.postalCode)}<br>Payment: ${e(o.paymentMethod)} — ${e(o.paymentStatus)}</p>
<table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>${rows}</table>
<p>Subtotal: Rs. ${o.subTotal}<br>Discount: Rs. ${o.discount}<br>Delivery: Rs. ${o.deliveryCharges}<br>Tax: Rs. ${o.tax}<br><b>Total: Rs. ${o.totalAmount}</b></p>`;
}
