'use client';
import ResourcePage from '@/components/admin/ResourcePage';
export default function Page() {
  return <ResourcePage title="Testimonials" sub="Customer quotes shown on the homepage." listPath="/admin/testimonials" writePath="/admin/testimonials" addLabel="Add testimonial"
    columns={[{ header: 'Name', cell: r => <b>{r.name}</b> }, { header: 'Quote', cell: r => <span className="line-clamp-2 max-w-md">{r.text}</span> }, { header: 'Rating', cell: r => '★'.repeat(r.rating) }, { header: 'Active', cell: r => (r.isActive ? 'Yes' : 'No') }]}
    fields={[{ name: 'name', label: 'Customer name', type: 'text', required: true }, { name: 'text', label: 'Quote', type: 'textarea', required: true }, { name: 'rating', label: 'Rating (1–5)', type: 'number', default: 5 }, { name: 'avatar', label: 'Photo (optional)', type: 'image', folder: 'content', spec: 'avatar' }, { name: 'isActive', label: 'Active', type: 'checkbox', default: true }]} />;
}
