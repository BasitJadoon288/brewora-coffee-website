'use client';
import ProductImage from '@/components/ProductImage';
import ResourcePage from '@/components/admin/ResourcePage';
export default function Page() {
  return <ResourcePage title="Banners" sub="Hero banner (first active one is shown) and promotional banners on the homepage." listPath="/admin/banners" writePath="/admin/banners" addLabel="Add banner"
    columns={[{ header: 'Image', cell: r => <ProductImage src={r.image} alt={r.title} className="h-10 w-16 rounded-lg" /> }, { header: 'Title', cell: r => <b>{r.title}</b> }, { header: 'Placement', cell: r => r.placement }, { header: 'Order', cell: r => r.sortOrder }, { header: 'Active', cell: r => (r.isActive ? 'Yes' : 'No') }]}
    fields={[{ name: 'title', label: 'Title', type: 'text', required: true }, { name: 'subtitle', label: 'Subtitle', type: 'text' }, { name: 'image', label: 'Image', type: 'image', folder: 'banners', spec: 'hero', required: true },
      { name: 'linkUrl', label: 'Link (e.g. /shop)', type: 'text' }, { name: 'buttonText', label: 'Button text', type: 'text' }, { name: 'placement', label: 'Placement', type: 'select', options: [{ value: 'hero', label: 'Hero (top of homepage)' }, { value: 'promo', label: 'Promotional strip' }], default: 'hero' },
      { name: 'sortOrder', label: 'Sort order', type: 'number', default: 0 }, { name: 'isActive', label: 'Active', type: 'checkbox', default: true }]} />;
}
