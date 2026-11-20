'use client';
import ResourcePage from '@/components/admin/ResourcePage';
import { Badge } from '@/components/ui';
import { money } from '@/lib/types';
export default function Page() {
  return <ResourcePage title="Delivery areas" sub="Set the delivery charge for each area. Customers pick their area at checkout." listPath="/admin/delivery-areas" writePath="/admin/delivery-areas" addLabel="Add area"
    columns={[{ header: 'Area', cell: r => <b>{r.name}</b> }, { header: 'City', cell: r => r.city }, { header: 'Delivery charge', cell: r => (r.charge ? money(r.charge) : 'Free') },
      { header: 'Free delivery above', cell: r => (r.freeDeliveryThreshold != null ? money(r.freeDeliveryThreshold) : 'Store default') }, { header: 'Order', cell: r => r.sortOrder },
      { header: 'Status', cell: r => <Badge value={r.isActive ? 'Active' : 'Hidden'} /> }]}
    fields={[{ name: 'name', label: 'Area name', type: 'text', required: true, hint: 'e.g. Clifton, DHA Phase 6, Gulshan-e-Iqbal' }, { name: 'city', label: 'City', type: 'text', default: 'Karachi', required: true },
      { name: 'charge', label: 'Delivery charge (Rs.)', type: 'number', required: true, default: 200, hint: 'Enter 0 for free delivery to this area.' },
      { name: 'freeDeliveryThreshold', label: 'Free delivery above (Rs.)', type: 'number', nullable: true, hint: 'Optional. Leave empty to use the store-wide limit from Settings.' },
      { name: 'sortOrder', label: 'Display order', type: 'number', default: 0, hint: 'Smaller numbers appear first in the checkout list.' },
      { name: 'isActive', label: 'Available for delivery', type: 'checkbox', default: true }]} />;
}
