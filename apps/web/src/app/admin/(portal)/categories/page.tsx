'use client';
import ProductImage from '@/components/ProductImage';
import { Badge } from '@/components/ui';
import ResourcePage from '@/components/admin/ResourcePage';
export default function Page() {
  return <ResourcePage title="Categories" sub="Shown on the homepage and in the shop filter." listPath="/admin/categories" writePath="/categories" paged={false} addLabel="Add category"
    columns={[{ header: 'Image', cell: r => <ProductImage src={r.image} alt={r.name} className="h-10 w-10 rounded-lg" /> }, { header: 'Name', cell: r => <b>{r.name}</b> }, { header: 'Slug', cell: r => r.slug }, { header: 'Status', cell: r => <Badge value={r.isActive ? 'Confirmed' : 'Cancelled'} /> }]}
    fields={[{ name: 'name', label: 'Name', type: 'text', required: true }, { name: 'slug', label: 'URL slug', type: 'text', hint: 'Optional — generated from the name. Lowercase letters, numbers, hyphens.' }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'image', label: 'Image', type: 'image', folder: 'categories', spec: 'category' }, { name: 'isActive', label: 'Active (visible on the website)', type: 'checkbox', default: true }]} />;
}
