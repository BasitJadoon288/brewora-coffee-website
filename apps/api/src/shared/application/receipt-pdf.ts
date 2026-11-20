/**
 * Dependency-free PDF receipt (one narrow, shop-style page, standard Helvetica fonts).
 * Layout is measured with the Helvetica metrics so text wraps and right-aligns correctly; the page height grows with the order.
 */
export type ReceiptKind = 'order' | 'delivery';
export interface ReceiptStore { storeName: string; address?: string; phone?: string; contactEmail?: string }
export interface ReceiptOrder {
  orderNumber: string; createdAt: Date | string; updatedAt?: Date | string; orderStatus: string; paymentMethod: string; paymentStatus: string;
  customerDetails: { fullName: string; phone: string; email: string };
  shippingAddress: { line1: string; city: string; area?: string; postalCode?: string };
  items: { name: string; variant?: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subTotal: number; discount: number; deliveryCharges: number; tax: number; totalAmount: number; couponCode?: string;
  statusHistory?: { status: string; at: Date | string }[];
}
/** Delivered orders get the delivery receipt; everything else the order receipt. */
export const receiptKindOf = (o: { orderStatus: string }): ReceiptKind => (o.orderStatus === 'Delivered' ? 'delivery' : 'order');

// Helvetica advance widths (1/1000 em) for ASCII 32..126
const W = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const WB = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
/** Keep printable Latin-1 only (standard PDF fonts); anything else (e.g. Urdu letters) becomes "?". */
const clean = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7e -ÿ]/g, '?').trim();
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const widthOf = (s: string, size: number, bold = false) => { const t = bold ? WB : W; let w = 0; for (const ch of s) { const c = ch.charCodeAt(0); w += c >= 32 && c <= 126 ? t[c - 32] : 556; } return (w * size) / 1000; };
const money = (n: number) => `Rs. ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const when = (d: Date | string | undefined) => { if (!d) return ''; try { return new Date(d).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }); } catch { return String(d); } };
function wrap(text: string, max: number, size: number, bold = false): string[] {
  const out: string[] = []; let line = '';
  for (const word of clean(text).split(' ').filter(Boolean)) {
    let w = word;
    while (widthOf(w, size, bold) > max) { let n = w.length; while (n > 1 && widthOf(w.slice(0, n), size, bold) > max) n--; if (line) { out.push(line); line = ''; } out.push(w.slice(0, n)); w = w.slice(n); }
    const t = line ? `${line} ${w}` : w;
    if (widthOf(t, size, bold) <= max) line = t; else { out.push(line); line = w; }
  }
  if (line) out.push(line);
  return out.length ? out : [''];
}

export function buildReceiptPdf(o: ReceiptOrder, store: ReceiptStore, kind: ReceiptKind = receiptKindOf(o)): Buffer {
  const PW = 320; const M = 22; const CW = PW - 2 * M; const ops: string[] = []; let y = 26; // y measured from the top
  const txt = (s: string, x: number, size: number, bold = false, gray = 0) => ops.push(`BT ${gray} g /F${bold ? 2 : 1} ${size} Tf ${x.toFixed(2)} ${'@Y'} Td (${esc(clean(s))}) Tj ET`.replace('@Y', `{${y.toFixed(2)}}`));
  const center = (s: string, size: number, bold = false, gray = 0) => txt(s, (PW - widthOf(clean(s), size, bold)) / 2, size, bold, gray);
  const right = (s: string, size: number, bold = false) => txt(s, PW - M - widthOf(clean(s), size, bold), size, bold);
  const dashed = () => { y += 4; ops.push(`[3 3] 0 d 0.5 w 0.45 G ${M} {${y.toFixed(2)}} m ${PW - M} {${y.toFixed(2)}} l S [] 0 d`); y += 10; };
  const row = (l: string, r: string, size = 9, bold = false) => { txt(l, M, size, bold); right(r, size, bold); y += size + 5; };
  const para = (label: string, value: string) => { txt(label, M, 7.5, false, 0.45); y += 11; for (const ln of wrap(value, CW, 9.5)) { txt(ln, M, 9.5); y += 13; } y += 3; };

  for (const ln of wrap(store.storeName.toUpperCase(), CW, 18, true)) { center(ln, 18, true); y += 22; }
  y -= 4;
  for (const s of [store.address, [store.phone, store.contactEmail].filter(Boolean).join('  |  ')]) if (s) for (const ln of wrap(s, CW, 8)) { center(ln, 8, false, 0.4); y += 11; }
  y += 6; dashed();
  y += 6; center(kind === 'delivery' ? 'DELIVERY RECEIPT' : 'ORDER RECEIPT', 13, true); y += 17;
  const paid = o.paymentStatus === 'Paid';
  center(kind === 'delivery' ? `Delivered${paid ? ' - PAID' : ''}` : paid ? 'Payment received - PAID' : o.paymentMethod === 'COD' ? 'Pay cash on delivery' : 'Payment pending', 9, false, 0.35); y += 8; dashed();

  row('Order no.', o.orderNumber, 9, true);
  row('Order date', when(o.createdAt));
  if (kind === 'delivery') row('Delivered on', when([...(o.statusHistory ?? [])].reverse().find(h => h.status === 'Delivered')?.at ?? o.updatedAt));
  y += 2; para('CUSTOMER', `${o.customerDetails.fullName}  -  ${o.customerDetails.phone}`);
  const a = o.shippingAddress; para('DELIVERY ADDRESS', [a.line1, a.area, a.city, a.postalCode].filter(Boolean).join(', '));
  dashed();

  txt('ITEM', M, 7.5, true, 0.45); right('AMOUNT', 7.5, true); y += 12;
  for (const i of o.items) {
    const name = i.variant ? `${i.name} (${i.variant})` : i.name; const amt = money(i.lineTotal); const max = CW - widthOf(amt, 9.5) - 10;
    const lines = wrap(name, max, 9.5); lines.forEach((ln, k) => { txt(ln, M, 9.5); if (k === 0) right(amt, 9.5); y += 12.5; });
    txt(`${i.quantity} x ${money(i.unitPrice)}`, M, 8, false, 0.45); y += 14;
  }
  dashed();
  row('Subtotal', money(o.subTotal)); if (o.discount > 0) row(`Discount${o.couponCode ? ` (${clean(o.couponCode)})` : ''}`, `- ${money(o.discount)}`);
  if (o.tax > 0) row('Tax', money(o.tax)); row('Delivery', o.deliveryCharges > 0 ? money(o.deliveryCharges) : 'Free');
  y += 2; ops.push(`0.8 w 0 G ${M} {${(y - 3).toFixed(2)}} m ${PW - M} {${(y - 3).toFixed(2)}} l S`); y += 9;
  row('TOTAL', money(o.totalAmount), 13, true); y += 2; dashed();
  row('Payment method', o.paymentMethod === 'COD' ? 'Cash on Delivery' : o.paymentMethod.replace(/([a-z])([A-Z])/g, '$1 $2'));
  row('Payment status', paid ? 'Paid' : o.paymentStatus); y += 8;
  center(`Thank you for shopping with ${store.storeName}!`, 9.5, true); y += 13;
  center(kind === 'delivery' ? 'We hope you enjoy every sip.' : 'We will email you when your order status changes.', 8, false, 0.4); y += 12;
  center('This is a computer-generated receipt.', 7, false, 0.55); y += 20;

  const H = Math.ceil(y);
  const content = ops.join('\n').replace(/\{([\d.]+)\}/g, (_m, v) => (H - Number(v)).toFixed(2));
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ];
  let pdf = '%PDF-1.4\n'; const offsets: number[] = [];
  objs.forEach((b, n) => { offsets.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${n + 1} 0 obj\n${b}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map(x => `${String(x).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info << /Title (${esc(clean(`${kind === 'delivery' ? 'Delivery' : 'Order'} receipt ${o.orderNumber}`))}) /Producer (${esc(clean(store.storeName))}) >> >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}
