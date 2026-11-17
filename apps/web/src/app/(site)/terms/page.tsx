import type { Metadata } from 'next';
import CmsPage, { type PageData } from '@/components/CmsPage';
import { getContent } from '@/lib/server';
export const metadata: Metadata = { title: 'Terms and Conditions' };
export default async function Page() { return <CmsPage d={await getContent<PageData>('terms', { title: 'Terms and Conditions', body: '' })} />; }
