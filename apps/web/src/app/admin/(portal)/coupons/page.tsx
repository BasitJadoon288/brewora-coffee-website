'use client';
import ResourcePage from '@/components/admin/ResourcePage';
import { fmtDate, money } from '@/lib/types';
export default function Page() {
  return <ResourcePage title="Coupons" sub="Discount codes customers can apply in the cart." listPath="/admin/coupons" writePath="/admin/coupons" addLabel="Add coupon"
    columns={[{ header: 'Code', cell: r => <b>{r.code}</b> }, { header: 'Discount', cell: r => r.discountType === 'Percentage' ? `${r.discountValue}%${r.maxDiscount ? ` (max ${money(r.maxDiscount)})` : ''}` : money(r.discountValue) }, { header: 'Min order', cell: r => money(r.minimumOrderAmount ?? 0) },
      { header: 'Used', cell: r => `${r.usedCount}${r.usageLimit ? ` / ${r.usageLimit}` : ''}` }, { header: 'Expires', cell: r => (r.expiryDate ? fmtDate(r.expiryDate) : '—') }, { header: 'Active', cell: r => (r.isActive ? 'Yes' : 'No') }]}
    fields={[{ name: 'code', label: 'Code', type: 'text', required: true, hint: 'Letters/numbers, e.g. WELCOME10' }, { name: 'description', label: 'Description', type: 'text' },
      { name: 'discountType', label: 'Type', type: 'select', options: [{ value: 'Percentage', label: 'Percentage (%)' }, { value: 'Fixed', label: 'Fixed amount (Rs.)' }], default: 'Percentage', required: true },
      { name: 'discountValue', label: 'Discount value', type: 'number', required: true }, { name: 'maxDiscount', label: 'Maximum discount (Rs.)', type: 'number', nullable: true, hint: 'Only for percentage coupons. Leave empty for no cap.' },
      { name: 'minimumOrderAmount', label: 'Minimum order amount (Rs.)', type: 'number', default: 0 }, { name: 'expiryDate', label: 'Expiry date', type: 'date', nullable: true }, { name: 'usageLimit', label: 'Usage limit', type: 'number', nullable: true, hint: 'Leave empty for unlimited.' },
      { name: 'isActive', label: 'Enabled', type: 'checkbox', default: true }]} />;
}
