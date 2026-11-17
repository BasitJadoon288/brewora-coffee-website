'use client';
import { useQuery } from '@tanstack/react-query';
import ProductForm from '@/components/admin/ProductForm';
import { PageTitle } from '@/components/admin/kit';
import { Loading } from '@/components/ui';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
export default function EditProduct({ params }: { params: { id: string } }) {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-product', params.id], queryFn: () => api<Product>(`/admin/products/${params.id}`) });
  if (isLoading) return <Loading />; if (error || !data) return <p role="alert" className="text-red-700">Product not found.</p>;
  return <div><PageTitle title={`Edit: ${data.name}`} /><ProductForm product={data} /></div>;
}
