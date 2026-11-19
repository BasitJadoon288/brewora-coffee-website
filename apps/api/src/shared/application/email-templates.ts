import { escapeHtml as e } from '../domain/text';

/** Brand e-mail templates. Table-based layout with inline styles so they render correctly in Gmail, Outlook and mobile clients. */
const BRAND = 'BREWORA'; const DARK = '#2b1a10'; const GOLD = '#c9a24a'; const CREAM = '#faf6ef'; const MUTED = '#7a6a5d';
export interface MailContent { subject: string; html: string }
const rs = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;

const layout = (title: string, preheader: string, body: string) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title></head>
<body style="margin:0;padding:0;background:${CREAM};font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#2b2b2b;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #eadfce;">
<tr><td align="center" style="background:${DARK};padding:22px;"><span style="font-size:26px;letter-spacing:6px;font-weight:700;color:${GOLD};">${BRAND}</span></td></tr>
<tr><td style="padding:28px 28px 8px 28px;font-size:15px;line-height:1.6;">${body}</td></tr>
<tr><td style="padding:8px 28px 26px 28px;font-size:12px;line-height:1.6;color:${MUTED};border-top:1px solid #f0e8da;">
This is an automated message from ${BRAND}. Please do not reply to this email.<br>If you did not expect it, you can safely ignore it.</td></tr>
</table></td></tr></table></body></html>`;

const button = (href: string, label: string) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;"><tr><td style="background:${DARK};border-radius:6px;"><a href="${e(href)}" style="display:inline-block;padding:12px 26px;color:${GOLD};text-decoration:none;font-weight:600;font-size:14px;">${e(label)}</a></td></tr></table>`;
const otpBox = (otp: string) => `<div style="margin:18px 0;padding:16px;text-align:center;background:${CREAM};border:1px dashed ${GOLD};border-radius:8px;"><span style="font-size:34px;letter-spacing:10px;font-weight:700;color:${DARK};">${e(otp)}</span></div>`;

export const verifyEmailMail = (p: { name: string; otp: string; link: string; minutes: number }): MailContent => ({
  subject: `${p.otp} is your ${BRAND} verification code`,
  html: layout('Verify your email', `Your verification code is ${p.otp}`, `
    <p style="margin:0 0 10px;font-size:18px;font-weight:600;color:${DARK};">Welcome to ${BRAND}, ${e(p.name)}!</p>
    <p style="margin:0 0 6px;">Use the code below to verify your email address and activate your account.</p>
    ${otpBox(p.otp)}
    <p style="margin:0 0 6px;">This code expires in <b>${p.minutes} minutes</b>. Never share it with anyone &mdash; ${BRAND} will never ask you for it.</p>
    <p style="margin:14px 0 0;color:${MUTED};font-size:13px;">Prefer a link? Verify with one click:</p>${button(p.link, 'Verify my email')}`),
});

export const resetPasswordMail = (p: { name: string; otp: string; link: string; minutes: number }): MailContent => ({
  subject: `${p.otp} is your ${BRAND} password reset code`,
  html: layout('Reset your password', `Your password reset code is ${p.otp}`, `
    <p style="margin:0 0 10px;font-size:18px;font-weight:600;color:${DARK};">Password reset request</p>
    <p style="margin:0 0 6px;">Hi ${e(p.name)}, we received a request to reset your ${BRAND} password. Enter this code to continue:</p>
    ${otpBox(p.otp)}
    <p style="margin:0 0 6px;">This code expires in <b>${p.minutes} minutes</b>. If you did not request a reset, your password is still safe &mdash; no changes were made, and you can ignore this email.</p>
    <p style="margin:14px 0 0;color:${MUTED};font-size:13px;">Or reset using a link:</p>${button(p.link, 'Reset my password')}`),
});

export interface MailOrder { orderNumber: string; customerDetails: { fullName: string }; items: { name: string; variant?: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subTotal: number; deliveryCharges: number; discount: number; tax: number; totalAmount: number; paymentMethod: string; shippingAddress: { line1: string; city: string; postalCode?: string } }

export const orderConfirmationMail = (o: MailOrder): MailContent => {
  const rows = o.items.map(i => `<tr><td style="padding:8px 0;border-bottom:1px solid #f0e8da;">${e(i.name)}${i.variant ? ` <span style="color:${MUTED};">(${e(i.variant)})</span>` : ''}<br><span style="color:${MUTED};font-size:13px;">${i.quantity} &times; ${rs(i.unitPrice)}</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #f0e8da;white-space:nowrap;">${rs(i.lineTotal)}</td></tr>`).join('');
  const line = (label: string, v: string, strong = false) => `<tr><td style="padding:3px 0;${strong ? `font-weight:700;color:${DARK};font-size:16px;` : `color:${MUTED};`}">${label}</td><td align="right" style="padding:3px 0;${strong ? `font-weight:700;color:${DARK};font-size:16px;` : ''}">${v}</td></tr>`;
  const a = o.shippingAddress;
  return {
    subject: `Order confirmed ${o.orderNumber} - ${BRAND}`,
    html: layout('Order confirmation', `Thank you! We received your order ${o.orderNumber}`, `
    <p style="margin:0 0 6px;font-size:18px;font-weight:600;color:${DARK};">Thank you for your order, ${e(o.customerDetails.fullName)}!</p>
    <p style="margin:0 0 14px;">We have received your order <b>${e(o.orderNumber)}</b> and will start preparing it shortly. You will get another email whenever its status changes.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
      ${line('Subtotal', rs(o.subTotal))}${o.discount ? line('Discount', `- ${rs(o.discount)}`) : ''}${o.tax ? line('Tax', rs(o.tax)) : ''}${line('Delivery', o.deliveryCharges ? rs(o.deliveryCharges) : 'Free')}${line('Total', rs(o.totalAmount), true)}
    </table>
    <p style="margin:18px 0 4px;color:${MUTED};font-size:13px;">PAYMENT METHOD</p><p style="margin:0;">${e(o.paymentMethod)}</p>
    <p style="margin:14px 0 4px;color:${MUTED};font-size:13px;">DELIVERY ADDRESS</p><p style="margin:0 0 14px;">${e(a.line1)}, ${e(a.city)}${a.postalCode ? ` ${e(a.postalCode)}` : ''}</p>`),
  };
};

const STATUS_COPY: Record<string, { title: string; text: string }> = {
  Confirmed: { title: 'Your order is confirmed', text: 'Good news &mdash; we have confirmed your order and will begin preparing it.' },
  Processing: { title: 'We are preparing your order', text: 'Your order is being carefully prepared and packed.' },
  Shipped: { title: 'Your order is on its way', text: 'Your order has been handed to our courier and is on its way to you.' },
  Delivered: { title: 'Your order has been delivered', text: 'Your order has been delivered. We hope you enjoy it! If anything is not right, please contact us.' },
  Cancelled: { title: 'Your order has been cancelled', text: 'Your order has been cancelled. If you already paid, the refund will be processed by our team. Please contact us if you have any questions.' },
  Pending: { title: 'Your order is pending', text: 'Your order is waiting for confirmation.' },
};
export const orderStatusMail = (o: { orderNumber: string; customerDetails: { fullName: string }; totalAmount: number }, status: string): MailContent => {
  const c = STATUS_COPY[status] ?? { title: `Order status: ${e(status)}`, text: `Your order status is now <b>${e(status)}</b>.` };
  return {
    subject: `${c.title} - ${o.orderNumber}`,
    html: layout(c.title, `${c.title} (${o.orderNumber})`, `
    <p style="margin:0 0 10px;font-size:18px;font-weight:600;color:${DARK};">${c.title}</p>
    <p style="margin:0 0 12px;">Hi ${e(o.customerDetails.fullName)}, ${c.text}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="background:${CREAM};border-radius:8px;width:100%;"><tr><td style="padding:14px 16px;">
      <span style="color:${MUTED};font-size:13px;">ORDER NUMBER</span><br><b style="color:${DARK};">${e(o.orderNumber)}</b><br><br>
      <span style="color:${MUTED};font-size:13px;">CURRENT STATUS</span><br><b style="color:${DARK};">${e(status)}</b><br><br>
      <span style="color:${MUTED};font-size:13px;">ORDER TOTAL</span><br><b style="color:${DARK};">${rs(o.totalAmount)}</b></td></tr></table>`),
  };
};
