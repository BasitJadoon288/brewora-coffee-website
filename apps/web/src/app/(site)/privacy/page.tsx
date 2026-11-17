import type { Metadata } from 'next';
import CmsPage, { type PageData } from '@/components/CmsPage';
import { getContent } from '@/lib/server';
export const metadata: Metadata = { title: 'Privacy Policy' };
export default async function Page() { return <CmsPage d={await getContent<PageData>('privacy', { title: 'Privacy Policy', body: '' })} />; }
