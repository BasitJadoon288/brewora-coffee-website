/** Default CMS pages. Everything here is editable by the admin (Admin → Content). Review the policy texts before launch. */
const para = (...p: string[]) => p.join('\n\n');
export const DEFAULT_CONTENT: Record<string, Record<string, unknown>> = {
  homepage: {
    announcement: 'Free delivery on orders above Rs. 3,000',
    sections: { categories: true, bestSellers: true, newArrivals: true, offers: true, why: true, story: true, testimonials: true, instagram: false, newsletter: true },
    whyTitle: 'Why Choose BREWORA',
    whyItems: [{ title: 'Premium quality', text: 'Ethically sourced beans, roasted and brewed with care.' }, { title: 'Always fresh', text: 'Prepared in small batches for peak flavor.' }, { title: 'Doorstep delivery', text: 'Fast, careful delivery across Pakistan.' }],
    storyTitle: 'Our Story', storyBody: 'BREWORA began with a simple belief: every sip tells a story. We bring carefully sourced coffee to your door.', storyImage: '/assets/about/story.jpg',
    instagramTitle: 'Follow us on Instagram', instagram: [], newsletterTitle: 'Join the BREWORA Circle', newsletterText: 'Offers and new blends, straight to your inbox.',
  },
  about: { title: 'About BREWORA', image: '/assets/about/story.jpg', body: para('BREWORA is a premium coffee brand built on a simple belief: every sip tells a story.', 'We source quality beans, roast and prepare them with care, and deliver them to your doorstep across Pakistan.') },
  faq: { title: 'Frequently Asked Questions', items: [
    { q: 'How long does delivery take?', a: 'Most orders arrive within 2–4 working days, depending on your city.' },
    { q: 'Which payment methods do you accept?', a: 'Cash on delivery, bank transfer and, where enabled, JazzCash and EasyPaisa.' },
    { q: 'Can I cancel my order?', a: 'You can cancel an order from your account while it is still pending. After that, please contact us.' },
    { q: 'How do I track my order?', a: 'Use the Track Order page with your order number and the email used at checkout.' }] },
  privacy: { title: 'Privacy Policy', body: para('We collect only the information needed to process your orders and improve our service: your name, contact details, delivery address and order history.', 'We do not sell your personal data. Payment details for online methods are handled by the payment provider and are never stored on our servers.', 'You can request correction or deletion of your data by contacting us.') },
  terms: { title: 'Terms and Conditions', body: para('By placing an order you agree to provide accurate information and to pay the total shown at checkout.', 'Prices are in Pakistani Rupees (PKR) and may change without notice. An order is confirmed once we accept it.', 'We may cancel orders that cannot be fulfilled; any payment received will be refunded.') },
  shipping: { title: 'Shipping Policy', body: para('We deliver across Pakistan. Delivery charges and the free-delivery threshold are shown at checkout.', 'Orders are usually dispatched within 1–2 working days. You will receive status updates by email.') },
  returns: { title: 'Return and Refund Policy', body: para('If your order arrives damaged or incorrect, contact us within 48 hours with your order number and a photo.', 'Approved refunds are returned to the original payment method or by bank transfer within 7–10 working days.') },
  contact: { title: 'Contact Us', intro: 'We would love to hear from you. Send us a message and we will reply as soon as we can.', hours: 'Mon–Sat, 10am – 8pm' },
};
