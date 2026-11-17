import type { Metadata } from 'next';
import CmsPage, { type PageData } from '@/components/CmsPage';
import { getContent } from '@/lib/server';
export const metadata: Metadata = { title: 'Shipping Policy' };
export default async function Page() { return <CmsPage d={await getContent<PageData>('shipping', { title: 'Shipping Policy', body: '' })} />; }
