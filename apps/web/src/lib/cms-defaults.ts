export interface HomeContent {
  announcement: string; sections: Record<'categories' | 'bestSellers' | 'newArrivals' | 'offers' | 'why' | 'story' | 'testimonials' | 'instagram' | 'newsletter', boolean>;
  whyTitle: string; whyItems: { title: string; text: string }[]; storyTitle: string; storyBody: string; storyImage: string;
  instagramTitle: string; instagram: { image: string; link?: string }[]; newsletterTitle: string; newsletterText: string;
}
export const HOME_DEFAULTS: HomeContent = {
  announcement: 'Free delivery on orders above Rs. 3,000',
  sections: { categories: true, bestSellers: true, newArrivals: true, offers: true, why: true, story: true, testimonials: true, instagram: false, newsletter: true },
  whyTitle: 'Why Choose BREWORA', whyItems: [{ title: 'Premium quality', text: 'Ethically sourced beans, roasted and brewed with care.' }, { title: 'Always fresh', text: 'Prepared in small batches for peak flavor.' }, { title: 'Doorstep delivery', text: 'Fast, careful delivery across Pakistan.' }],
  storyTitle: 'Our Story', storyBody: 'BREWORA began with a simple belief: every sip tells a story.', storyImage: '/assets/about/story.jpg',
  instagramTitle: 'Follow us on Instagram', instagram: [], newsletterTitle: 'Join the BREWORA Circle', newsletterText: 'Offers and new blends, straight to your inbox.',
};
export const PAGE_KEYS = { about: 'About Us', privacy: 'Privacy Policy', terms: 'Terms and Conditions', shipping: 'Shipping Policy', returns: 'Return and Refund Policy' } as const;
