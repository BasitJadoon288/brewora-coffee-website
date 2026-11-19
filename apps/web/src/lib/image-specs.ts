/**
 * Single source of truth for image sizes.
 * Admin upload fields show these sizes; the website shows each image in a FIXED box
 * with the same ratio (object-cover), so images never stretch or break the layout.
 */
export interface ImageSpec { width: number; height: number; label: string; where: string }
export const IMAGE_SPECS = {
  product: { width: 1000, height: 1000, label: 'Square 1:1', where: 'Product cards & product page' },
  category: { width: 800, height: 600, label: 'Landscape 4:3', where: 'Homepage category tiles' },
  hero: { width: 1000, height: 1000, label: 'Square 1:1', where: 'Homepage hero (top banner)' },
  promo: { width: 1600, height: 600, label: 'Wide banner', where: 'Homepage promotional strip' },
  story: { width: 1200, height: 900, label: 'Landscape 4:3', where: 'Homepage "Our story" section' },
  about: { width: 1600, height: 900, label: 'Wide 16:9', where: 'About / content page header' },
  instagram: { width: 800, height: 800, label: 'Square 1:1', where: 'Homepage Instagram gallery' },
  avatar: { width: 200, height: 200, label: 'Square 1:1', where: 'Customer photo in reviews slider' },
  logo: { width: 400, height: 100, label: 'Wide logo', where: 'Website header (transparent PNG/SVG best)' },
} as const satisfies Record<string, ImageSpec>;
export type SpecKey = keyof typeof IMAGE_SPECS;
export const MAX_UPLOAD_MB = 5;
