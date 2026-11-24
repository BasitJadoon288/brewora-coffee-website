import { Award, Leaf, Truck } from 'lucide-react';
import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import ProductCard from '@/components/ProductCard';
import ProductImage from '@/components/ProductImage';
import Reveal from '@/components/Reveal';
import TestimonialSlider from '@/components/TestimonialSlider';
import { getHomeContent, serverGet } from '@/lib/server';
import { paragraphs } from '@/lib/text';
import type { Category, Paged, Product } from '@/lib/types';
import type { Testimonial } from '@/components/TestimonialSlider';
const empty: Paged<Product> = { items: [], total: 0, page: 1, pages: 0 };
interface Banner { id: string; title: string; subtitle?: string; image: string; linkUrl?: string; buttonText?: string }
const ICONS = [Award, Leaf, Truck];
function Section({ title, sub, children, dark, id }: { title: string; sub?: string; children: React.ReactNode; dark?: boolean; id?: string }) {
  return <section id={id} className={dark ? 'bg-espresso py-12 text-cream md:py-16' : 'py-12 md:py-16'}><Reveal className="container-x"><div className="mb-8 text-center md:mb-10"><h2 className="font-display text-2xl sm:text-3xl md:text-4xl">{title}</h2>{sub && <p className={`mt-2 text-sm ${dark ? 'text-cream/70' : 'text-charcoal/60'}`}>{sub}</p>}</div>{children}</Reveal></section>;
}
const grid = 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4';
export default async function Home() {
  const [c, best, fresh, cats, testimonials, hero, promo] = await Promise.all([
    getHomeContent(), serverGet('/api/products?bestSeller=true&limit=4&sort=popular', empty), serverGet('/api/products?sort=newest&limit=12', empty),
    serverGet<Category[]>('/api/categories', []), serverGet<Testimonial[]>('/api/testimonials', []), serverGet<Banner[]>('/api/banners?placement=hero', []), serverGet<Banner[]>('/api/banners?placement=promo', []),
  ]);
  const b = hero[0]; const sec = c.sections;
  const offers = fresh.items.filter(p => p.discountPrice != null && p.discountPrice < p.price).slice(0, 4);
  return (<>
    <section className="relative overflow-hidden bg-espresso text-cream">
      <div className="container-x grid items-center gap-8 py-10 sm:py-14 md:min-h-[520px] md:grid-cols-2 md:py-20">
        <div className="order-2 text-center md:order-1 md:text-left"><p className="fade-up mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-caramel sm:mb-4 sm:text-xs sm:tracking-[0.3em]">Premium Coffee · Pakistan</p>
          <h1 className="fade-up-2 font-display text-4xl leading-tight sm:text-5xl md:text-6xl">{b?.title ?? 'Discover the Perfect Cup'}</h1>
          <p className="fade-up-3 mx-auto mt-4 max-w-md text-base text-cream/80 sm:mt-5 sm:text-lg md:mx-0">{b?.subtitle ?? 'Rich Flavor. Premium Quality. Delivered to Your Doorstep.'}</p>
          <div className="fade-up-3 mt-6 flex flex-wrap justify-center gap-3 sm:mt-8 sm:gap-4 md:justify-start"><Link href={b?.linkUrl || '/shop'} className="btn-gold">{b?.buttonText || 'Shop Now'}</Link><Link href="/shop#collection" className="btn-outline">Explore Collection</Link></div></div>
        <div className="fade-up order-1 mx-auto w-full max-w-[260px] sm:max-w-[320px] md:order-2 md:mr-0 md:max-w-[380px] md:justify-self-end"><div className="aspect-square w-full overflow-hidden rounded-[1.5rem] shadow-soft md:rounded-[2rem]"><ProductImage src={b?.image || c.heroImage || best.items[0]?.images?.[0]?.url || fresh.items[0]?.images?.[0]?.url || '/assets/banners/hero.jpg'} alt="BREWORA coffee" eager className="h-full w-full" /></div></div>
      </div></section>
    {sec.categories && cats.length > 0 && <Section title="Featured Categories" sub="Find your favourite brew" id="collection"><div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cats.map(x => <Link key={x.id} href={`/shop?category=${x.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-2xl"><ProductImage src={x.image} alt={x.name} className="h-full w-full transition duration-500 group-hover:scale-110" />
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 font-display text-base text-cream sm:p-4 sm:text-lg">{x.name}</span></Link>)}</div></Section>}
    {sec.bestSellers && best.items.length > 0 && <Section title="Best Sellers" sub="Loved by our customers"><div className={grid}>{best.items.map(p => <ProductCard key={p.id} p={p} />)}</div></Section>}
    {promo[0] && <Reveal><section className="container-x"><Link href={promo[0].linkUrl || '/shop'} className="group relative block overflow-hidden rounded-2xl bg-espresso text-cream sm:rounded-3xl"><ProductImage src={promo[0].image} alt={promo[0].title} className="absolute inset-0 h-full w-full opacity-40 transition duration-700 group-hover:scale-105" />
      <div className="relative px-5 py-10 text-center sm:px-8 sm:py-14"><h2 className="font-display text-2xl sm:text-3xl">{promo[0].title}</h2>{promo[0].subtitle && <p className="mt-2 text-cream/80">{promo[0].subtitle}</p>}<span className="btn-gold mt-6">{promo[0].buttonText || 'Explore Collection'}</span></div></Link></section></Reveal>}
    {sec.newArrivals && fresh.items.length > 0 && <Section title="New Arrivals"><div className={grid}>{fresh.items.slice(0, 4).map(p => <ProductCard key={p.id} p={p} />)}</div></Section>}
    {sec.offers && offers.length > 0 && <Section dark title="Special Offers" sub="Limited-time prices"><div className={grid}>{offers.map(p => <ProductCard key={p.id} p={p} />)}</div></Section>}
    {sec.why && <Section title={c.whyTitle}><div className="grid gap-6 md:grid-cols-3">{c.whyItems.map((w, i) => { const I = ICONS[i % ICONS.length]; return <div key={i} className="rounded-2xl bg-white p-6 text-center shadow-soft transition duration-300 hover:-translate-y-1 sm:p-8"><I className="mx-auto h-8 w-8 text-caramel" aria-hidden /><h3 className="mt-4 font-display text-xl text-espresso">{w.title}</h3><p className="mt-2 text-sm text-charcoal/70">{w.text}</p></div>; })}</div></Section>}
    {sec.story && <section className="bg-white py-12 md:py-16"><Reveal className="container-x grid items-center gap-6 md:grid-cols-2 md:gap-10"><div className="aspect-[4/3] w-full overflow-hidden rounded-2xl"><ProductImage src={c.storyImage} alt={c.storyTitle} className="h-full w-full" /></div>
      <div><h2 className="font-display text-2xl text-espresso sm:text-3xl md:text-4xl">{c.storyTitle}</h2>{paragraphs(c.storyBody).map((t, i) => <p key={i} className="mt-4 text-charcoal/70">{t}</p>)}<Link href="/about" className="btn-dark mt-6">Read more</Link></div></Reveal></section>}
    {sec.testimonials && testimonials.length > 0 && <Section title="What Our Customers Say"><TestimonialSlider items={testimonials} /></Section>}
    {sec.instagram && c.instagram.length > 0 && <Section title={c.instagramTitle}><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{c.instagram.slice(0, 8).map((x, i) => { const img = <div className="group aspect-square w-full overflow-hidden rounded-xl"><ProductImage src={x.image} alt={`${c.instagramTitle} ${i + 1}`} className="h-full w-full transition duration-500 group-hover:scale-110" /></div>; return x.link ? <a key={i} href={x.link} target="_blank" rel="noopener noreferrer">{img}</a> : <div key={i}>{img}</div>; })}</div></Section>}
    {sec.newsletter && <section className="bg-espresso py-12 text-center text-cream md:py-16"><Reveal className="container-x"><h2 className="font-display text-2xl sm:text-3xl">{c.newsletterTitle}</h2><p className="mb-8 mt-2 text-sm text-cream/70">{c.newsletterText}</p><NewsletterForm /></Reveal></section>}
  </>);
}
