import { AppError } from '../middleware/errorHandler';

export const SEXUAL_WELLNESS_CATEGORY_SLUG = 'sexual-wellness';
export const GIFT_IDEAS_CATEGORY_SLUG = 'gift-ideas';
export const CJ_DROPSHIPPING_CATEGORY_SLUG = 'cj-dropshipping';

export const ADMIN_PRODUCT_CATEGORY_META = {
  [SEXUAL_WELLNESS_CATEGORY_SLUG]: { name: 'Sexual Wellness', slug: SEXUAL_WELLNESS_CATEGORY_SLUG },
  [GIFT_IDEAS_CATEGORY_SLUG]: { name: 'Gift Ideas', slug: GIFT_IDEAS_CATEGORY_SLUG },
} as const;

export type AdminProductCategorySlug = keyof typeof ADMIN_PRODUCT_CATEGORY_META;
export type ImageStorageOwner = 'admin' | 'cj';

export interface ImageStoragePolicy {
  categorySlug: string;
  allowCloudinaryUpload: boolean;
  requireExternalHttpsUrl: boolean;
}

export interface ExternalProductImageInput {
  url: string;
  publicId: null;
  position: number;
}

const ADMIN_PRODUCT_CATEGORY_SLUGS = new Set<string>(Object.keys(ADMIN_PRODUCT_CATEGORY_META));

export function isValidHttpsImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function normalizeExternalImageUrls(input: unknown): string[] {
  const rawValues = Array.isArray(input) ? input : typeof input === 'string' ? [input] : [];
  return rawValues
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function resolveAdminProductCategorySlug(value: unknown): AdminProductCategorySlug {
  const slug = String(value ?? '').trim();
  if (!slug) {
    throw new AppError('Product category is required.');
  }

  if (!ADMIN_PRODUCT_CATEGORY_SLUGS.has(slug)) {
    throw new AppError('Invalid product category.');
  }

  return slug as AdminProductCategorySlug;
}

export function getAdminProductCategoryName(slug: AdminProductCategorySlug) {
  return ADMIN_PRODUCT_CATEGORY_META[slug].name;
}

export function getImageStoragePolicy(categorySlug: string, owner: ImageStorageOwner = 'admin'): ImageStoragePolicy {
  if (owner === 'cj' || categorySlug === CJ_DROPSHIPPING_CATEGORY_SLUG) {
    return { categorySlug, allowCloudinaryUpload: false, requireExternalHttpsUrl: true };
  }

  if (categorySlug === SEXUAL_WELLNESS_CATEGORY_SLUG) {
    return { categorySlug, allowCloudinaryUpload: false, requireExternalHttpsUrl: false };
  }

  return { categorySlug, allowCloudinaryUpload: true, requireExternalHttpsUrl: false };
}

export function assertCloudinaryUploadAllowed(policy: ImageStoragePolicy) {
  if (!policy.allowCloudinaryUpload) {
    throw new AppError('This product category requires external HTTPS image URLs and cannot upload images to Cloudinary.');
  }
}

export function buildExternalProductImages(imageUrls: string[], policy: ImageStoragePolicy): ExternalProductImageInput[] {
  if (!policy.requireExternalHttpsUrl && !imageUrls.length) return [];

  if (!imageUrls.length) {
    throw new AppError('At least one external HTTPS image URL is required for this product category.');
  }

  for (const imageUrl of imageUrls) {
    if (!isValidHttpsImageUrl(imageUrl)) {
      throw new AppError('External product image URLs must be valid HTTPS URLs.');
    }
  }

  return imageUrls.map((url, position) => ({ url, publicId: null, position }));
}
