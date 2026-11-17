'use client';
import { useState } from 'react';
import ContentEditor from '@/components/admin/ContentEditor';
import { PageTitle, Tabs } from '@/components/admin/kit';
export default function Content() {
  const [k, setK] = useState('homepage');
  return <div><PageTitle title="Pages & content" sub="Edit the text and sections of your website. Changes go live as soon as you save." />
    <Tabs value={k} onChange={setK} tabs={[['homepage', 'Homepage'], ['about', 'About us'], ['faq', 'FAQ'], ['contact', 'Contact'], ['privacy', 'Privacy policy'], ['terms', 'Terms'], ['shipping', 'Shipping'], ['returns', 'Returns & refunds']]} />
    <ContentEditor k={k} /></div>;
}
